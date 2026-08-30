<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\TechnologyRequest;
use App\Http\Resources\TechnologyResource;
use App\Models\Technology;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnologyController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $technologies = Technology::query()
            ->withCount('projects')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), fn ($query) => $query->where(function ($inner) use ($request) {
                $term = '%'.$request->string('search').'%';
                $inner->where('name', 'like', $term)->orWhere('slug', 'like', $term);
            }))
            ->ordered()
            ->get();

        return $this->respondSuccess(
            TechnologyResource::collection($technologies),
            'Technologies retrieved successfully.'
        );
    }

    public function store(TechnologyRequest $request): JsonResponse
    {
        $technology = Technology::query()->create($request->validated());

        return $this->respondCreated(new TechnologyResource($technology), 'Technology created successfully.');
    }

    public function show(Technology $technology): JsonResponse
    {
        return $this->respondSuccess(
            new TechnologyResource($technology->loadCount('projects')),
            'Technology retrieved successfully.'
        );
    }

    public function update(TechnologyRequest $request, Technology $technology): JsonResponse
    {
        $technology->update($request->validated());

        return $this->respondSuccess(new TechnologyResource($technology), 'Technology updated successfully.');
    }

    public function destroy(Technology $technology): JsonResponse
    {
        $technology->delete();

        return $this->respondSuccess(null, 'Technology moved to trash successfully.');
    }

    public function restore(string $technology): JsonResponse
    {
        Technology::onlyTrashed()->findOrFail($technology)->restore();

        return $this->respondSuccess(null, 'Technology restored successfully.');
    }

    public function forceDestroy(string $technology): JsonResponse
    {
        Technology::withTrashed()->findOrFail($technology)->forceDelete();

        return $this->respondSuccess(null, 'Technology permanently deleted successfully.');
    }

    public function toggleActive(Technology $technology): JsonResponse
    {
        $technology->update(['is_active' => ! $technology->is_active]);

        return $this->respondSuccess(
            ['is_active' => $technology->is_active],
            $technology->is_active
                ? 'Technology activated successfully.'
                : 'Technology deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        Technology::applyOrder($request->items());

        return $this->respondSuccess(null, 'Technology order updated successfully.');
    }
}
