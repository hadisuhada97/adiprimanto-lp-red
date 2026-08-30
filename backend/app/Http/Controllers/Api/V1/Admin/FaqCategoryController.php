<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\FaqCategoryRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\FaqCategoryResource;
use App\Models\FaqCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FaqCategoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $categories = FaqCategory::query()
            ->with('translations')
            ->withCount('faqs')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->ordered()
            ->get();

        return $this->respondSuccess(
            FaqCategoryResource::collection($categories),
            'FAQ categories retrieved successfully.'
        );
    }

    public function store(FaqCategoryRequest $request): JsonResponse
    {
        $category = DB::transaction(function () use ($request) {
            $category = FaqCategory::query()->create($request->categoryAttributes());
            $category->syncTranslations($request->translations());

            return $category;
        });

        return $this->respondCreated(
            new FaqCategoryResource($category->refresh()->load('translations')),
            'FAQ category created successfully.'
        );
    }

    public function show(FaqCategory $category): JsonResponse
    {
        return $this->respondSuccess(
            new FaqCategoryResource($category->load('translations')->loadCount('faqs')),
            'FAQ category retrieved successfully.'
        );
    }

    public function update(FaqCategoryRequest $request, FaqCategory $category): JsonResponse
    {
        DB::transaction(function () use ($request, $category) {
            $category->update($request->categoryAttributes());

            if ($request->has('translations')) {
                $category->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new FaqCategoryResource($category->fresh('translations')),
            'FAQ category updated successfully.'
        );
    }

    public function destroy(FaqCategory $category): JsonResponse
    {
        $category->delete();

        return $this->respondSuccess(null, 'FAQ category moved to trash successfully.');
    }

    public function restore(string $category): JsonResponse
    {
        FaqCategory::onlyTrashed()->findOrFail($category)->restore();

        return $this->respondSuccess(null, 'FAQ category restored successfully.');
    }

    public function forceDestroy(string $category): JsonResponse
    {
        FaqCategory::withTrashed()->findOrFail($category)->forceDelete();

        return $this->respondSuccess(null, 'FAQ category permanently deleted successfully.');
    }

    public function toggleActive(FaqCategory $category): JsonResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        return $this->respondSuccess(
            ['is_active' => $category->is_active],
            $category->is_active
                ? 'FAQ category activated successfully.'
                : 'FAQ category deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        FaqCategory::applyOrder($request->items());

        return $this->respondSuccess(null, 'FAQ category order updated successfully.');
    }
}
