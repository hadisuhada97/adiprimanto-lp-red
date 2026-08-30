<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\TechnologyRequest;
use App\Http\Resources\TechnologyResource;
use App\Models\Technology;
use Illuminate\Http\JsonResponse;

class TechnologyController extends BaseApiController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess(
            TechnologyResource::collection(Technology::query()->ordered()->get()),
            'Technologies retrieved successfully.'
        );
    }

    public function store(TechnologyRequest $request): JsonResponse
    {
        $technology = Technology::query()->create($request->validated());

        return $this->respondCreated(new TechnologyResource($technology), 'Technology created successfully.');
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
}
