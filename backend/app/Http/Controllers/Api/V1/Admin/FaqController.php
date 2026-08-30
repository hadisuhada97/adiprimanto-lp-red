<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\FaqRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FaqController extends BaseApiController
{
    protected array $relations = ['translations', 'category.translations'];

    public function index(Request $request): JsonResponse
    {
        $faqs = Faq::query()
            ->with($this->relations)
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('category_id'), fn ($query) => $query->where('faq_category_id', $request->string('category_id')))
            ->when($request->filled('search'), fn ($query) => $query->whereHas(
                'translations',
                fn ($inner) => $inner->where('question', 'like', '%'.$request->string('search').'%')
                    ->orWhere('answer', 'like', '%'.$request->string('search').'%')
            ))
            ->ordered()
            ->get();

        return $this->respondSuccess(FaqResource::collection($faqs), 'FAQs retrieved successfully.');
    }

    public function store(FaqRequest $request): JsonResponse
    {
        $faq = DB::transaction(function () use ($request) {
            $faq = Faq::query()->create($request->faqAttributes());
            $faq->syncTranslations($request->translations());

            return $faq;
        });

        return $this->respondCreated(
            new FaqResource($faq->refresh()->load($this->relations)),
            'FAQ created successfully.'
        );
    }

    public function show(Faq $faq): JsonResponse
    {
        return $this->respondSuccess(
            new FaqResource($faq->load($this->relations)),
            'FAQ retrieved successfully.'
        );
    }

    public function update(FaqRequest $request, Faq $faq): JsonResponse
    {
        DB::transaction(function () use ($request, $faq) {
            $faq->update($request->faqAttributes());

            if ($request->has('translations')) {
                $faq->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new FaqResource($faq->fresh($this->relations)),
            'FAQ updated successfully.'
        );
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return $this->respondSuccess(null, 'FAQ moved to trash successfully.');
    }

    public function restore(string $faq): JsonResponse
    {
        Faq::onlyTrashed()->findOrFail($faq)->restore();

        return $this->respondSuccess(null, 'FAQ restored successfully.');
    }

    public function forceDestroy(string $faq): JsonResponse
    {
        Faq::withTrashed()->findOrFail($faq)->forceDelete();

        return $this->respondSuccess(null, 'FAQ permanently deleted successfully.');
    }

    public function toggleActive(Faq $faq): JsonResponse
    {
        $faq->update(['is_active' => ! $faq->is_active]);

        return $this->respondSuccess(
            ['is_active' => $faq->is_active],
            $faq->is_active ? 'FAQ activated successfully.' : 'FAQ deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        Faq::applyOrder($request->items());

        return $this->respondSuccess(null, 'FAQ order updated successfully.');
    }
}
