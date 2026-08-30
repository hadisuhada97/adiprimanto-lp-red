<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ProjectCategoryRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\ProjectCategoryResource;
use App\Models\ProjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectCategoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $categories = ProjectCategory::query()
            ->with('translations')
            ->withCount('projects')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), fn ($query) => $query->where(function ($inner) use ($request) {
                $term = '%'.$request->string('search').'%';
                $inner->where('slug', 'like', $term)
                    ->orWhereHas('translations', fn ($t) => $t->where('name', 'like', $term));
            }))
            ->ordered()
            ->get();

        return $this->respondSuccess(
            ProjectCategoryResource::collection($categories),
            'Project categories retrieved successfully.'
        );
    }

    public function store(ProjectCategoryRequest $request): JsonResponse
    {
        $category = DB::transaction(function () use ($request) {
            $category = ProjectCategory::query()->create($request->safe()->except('translations'));
            $category->syncTranslations($request->safe()->array('translations'));

            return $category;
        });

        return $this->respondCreated(
            new ProjectCategoryResource($category->load('translations')->loadCount('projects')),
            'Project category created successfully.'
        );
    }

    public function show(ProjectCategory $category): JsonResponse
    {
        return $this->respondSuccess(
            new ProjectCategoryResource($category->load('translations')->loadCount('projects')),
            'Project category retrieved successfully.'
        );
    }

    public function update(ProjectCategoryRequest $request, ProjectCategory $category): JsonResponse
    {
        DB::transaction(function () use ($request, $category) {
            $category->update($request->safe()->except('translations'));

            if ($request->has('translations')) {
                $category->syncTranslations($request->safe()->array('translations'));
            }
        });

        return $this->respondSuccess(
            new ProjectCategoryResource($category->fresh('translations')->loadCount('projects')),
            'Project category updated successfully.'
        );
    }

    public function destroy(ProjectCategory $category): JsonResponse
    {
        $category->delete();

        return $this->respondSuccess(null, 'Project category moved to trash successfully.');
    }

    public function restore(string $category): JsonResponse
    {
        ProjectCategory::onlyTrashed()->findOrFail($category)->restore();

        return $this->respondSuccess(null, 'Project category restored successfully.');
    }

    public function forceDestroy(string $category): JsonResponse
    {
        ProjectCategory::withTrashed()->findOrFail($category)->forceDelete();

        return $this->respondSuccess(null, 'Project category permanently deleted successfully.');
    }

    public function toggleActive(ProjectCategory $category): JsonResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        return $this->respondSuccess(
            ['is_active' => $category->is_active],
            $category->is_active
                ? 'Project category activated successfully.'
                : 'Project category deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        ProjectCategory::applyOrder($request->items());

        return $this->respondSuccess(null, 'Project category order updated successfully.');
    }
}
