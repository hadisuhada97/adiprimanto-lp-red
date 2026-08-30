<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $projects = Project::query()
            ->with(['translations', 'category.translations', 'cover', 'technologies'])
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), fn ($query) => $query->where(function ($inner) use ($request) {
                $term = '%'.$request->string('search').'%';
                $inner->where('slug', 'like', $term)
                    ->orWhereHas('translations', fn ($t) => $t->where('title', 'like', $term));
            }))
            ->when($request->filled('category_id'), fn ($query) => $query->where('project_category_id', $request->string('category_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->ordered()
            ->paginate($this->perPage());

        return $this->respondPaginated(
            ProjectResource::collection($projects),
            'Projects retrieved successfully.'
        );
    }

    public function store(ProjectRequest $request): JsonResponse
    {
        $project = DB::transaction(function () use ($request) {
            $project = Project::query()->create($request->projectAttributes());
            $project->syncTranslations($request->translations());
            $project->technologies()->sync($request->safe()->array('technology_ids'));

            return $project;
        });

        return $this->respondCreated(
            new ProjectResource($project->load(['translations', 'category.translations', 'cover', 'technologies'])),
            'Project created successfully.'
        );
    }

    public function show(Project $project): JsonResponse
    {
        return $this->respondSuccess(
            new ProjectResource($project->load(['translations', 'category.translations', 'cover', 'technologies'])),
            'Project retrieved successfully.'
        );
    }

    public function update(ProjectRequest $request, Project $project): JsonResponse
    {
        DB::transaction(function () use ($request, $project) {
            $project->update($request->projectAttributes());

            if ($request->has('translations')) {
                $project->syncTranslations($request->translations());
            }

            if ($request->has('technology_ids')) {
                $project->technologies()->sync($request->safe()->array('technology_ids'));
            }
        });

        return $this->respondSuccess(
            new ProjectResource($project->fresh(['translations', 'category.translations', 'cover', 'technologies'])),
            'Project updated successfully.'
        );
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return $this->respondSuccess(null, 'Project moved to trash successfully.');
    }

    public function restore(string $project): JsonResponse
    {
        $model = Project::onlyTrashed()->findOrFail($project);
        $model->restore();

        return $this->respondSuccess(null, 'Project restored successfully.');
    }

    public function forceDestroy(string $project): JsonResponse
    {
        Project::withTrashed()->findOrFail($project)->forceDelete();

        return $this->respondSuccess(null, 'Project permanently deleted successfully.');
    }

    public function toggleActive(Project $project): JsonResponse
    {
        $project->update(['is_active' => ! $project->is_active]);

        return $this->respondSuccess(
            ['is_active' => $project->is_active],
            $project->is_active ? 'Project activated successfully.' : 'Project deactivated successfully.'
        );
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        Project::applyOrder($validated['items']);

        return $this->respondSuccess(null, 'Project order updated successfully.');
    }
}
