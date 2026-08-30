<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\TestimonialRequest;
use App\Http\Resources\TestimonialResource;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestimonialController extends BaseApiController
{
    protected array $relations = ['translations', 'avatar', 'screenshot'];

    public function index(Request $request): JsonResponse
    {
        $testimonials = Testimonial::query()
            ->with($this->relations)
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), fn ($query) => $query->whereHas(
                'translations',
                fn ($inner) => $inner->where('name', 'like', '%'.$request->string('search').'%')
                    ->orWhere('feedback', 'like', '%'.$request->string('search').'%')
            ))
            ->ordered()
            ->get();

        return $this->respondSuccess(
            TestimonialResource::collection($testimonials),
            'Testimonials retrieved successfully.'
        );
    }

    public function store(TestimonialRequest $request): JsonResponse
    {
        $testimonial = DB::transaction(function () use ($request) {
            $testimonial = Testimonial::query()->create($request->testimonialAttributes());
            $testimonial->syncTranslations($request->translations());

            return $testimonial;
        });

        return $this->respondCreated(
            new TestimonialResource($testimonial->refresh()->load($this->relations)),
            'Testimonial created successfully.'
        );
    }

    public function show(Testimonial $testimonial): JsonResponse
    {
        return $this->respondSuccess(
            new TestimonialResource($testimonial->load($this->relations)),
            'Testimonial retrieved successfully.'
        );
    }

    public function update(TestimonialRequest $request, Testimonial $testimonial): JsonResponse
    {
        DB::transaction(function () use ($request, $testimonial) {
            $testimonial->update($request->testimonialAttributes());

            if ($request->has('translations')) {
                $testimonial->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new TestimonialResource($testimonial->fresh($this->relations)),
            'Testimonial updated successfully.'
        );
    }

    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return $this->respondSuccess(null, 'Testimonial moved to trash successfully.');
    }

    public function restore(string $testimonial): JsonResponse
    {
        Testimonial::onlyTrashed()->findOrFail($testimonial)->restore();

        return $this->respondSuccess(null, 'Testimonial restored successfully.');
    }

    public function forceDestroy(string $testimonial): JsonResponse
    {
        Testimonial::withTrashed()->findOrFail($testimonial)->forceDelete();

        return $this->respondSuccess(null, 'Testimonial permanently deleted successfully.');
    }

    public function toggleActive(Testimonial $testimonial): JsonResponse
    {
        $testimonial->update(['is_active' => ! $testimonial->is_active]);

        return $this->respondSuccess(
            ['is_active' => $testimonial->is_active],
            $testimonial->is_active
                ? 'Testimonial activated successfully.'
                : 'Testimonial deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        Testimonial::applyOrder($request->items());

        return $this->respondSuccess(null, 'Testimonial order updated successfully.');
    }
}
