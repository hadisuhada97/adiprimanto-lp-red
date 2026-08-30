<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ProjectCategoryRequest;
use App\Http\Resources\ProjectCategoryResource;
use App\Models\ProjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProjectCategoryController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $categories = ProjectCategory::query()
            ->with('translations')
            ->withCount('projects')
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
            new ProjectCategoryResource($category->load('translations')),
            'Project category created successfully.'
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
            new ProjectCategoryResource($category->fresh('translations')),
            'Project category updated successfully.'
        );
    }

    public function destroy(ProjectCategory $category): JsonResponse
    {
        $category->delete();

        return $this->respondSuccess(null, 'Project category moved to trash successfully.');
    }
}
