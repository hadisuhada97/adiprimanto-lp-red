<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\ServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $services = Service::query()
            ->with('translations')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), fn ($query) => $query->whereHas(
                'translations',
                fn ($inner) => $inner->where('title', 'like', '%'.$request->string('search').'%')
            ))
            ->ordered()
            ->get();

        return $this->respondSuccess(
            ServiceResource::collection($services),
            'Services retrieved successfully.'
        );
    }

    public function store(ServiceRequest $request): JsonResponse
    {
        $service = DB::transaction(function () use ($request) {
            $service = Service::query()->create($request->serviceAttributes());
            $service->syncTranslations($request->translations());

            return $service;
        });

        return $this->respondCreated(
            new ServiceResource($service->refresh()->load('translations')),
            'Service created successfully.'
        );
    }

    public function show(Service $service): JsonResponse
    {
        return $this->respondSuccess(
            new ServiceResource($service->load('translations')),
            'Service retrieved successfully.'
        );
    }

    public function update(ServiceRequest $request, Service $service): JsonResponse
    {
        DB::transaction(function () use ($request, $service) {
            $service->update($request->serviceAttributes());

            if ($request->has('translations')) {
                $service->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new ServiceResource($service->fresh('translations')),
            'Service updated successfully.'
        );
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return $this->respondSuccess(null, 'Service moved to trash successfully.');
    }

    public function restore(string $service): JsonResponse
    {
        Service::onlyTrashed()->findOrFail($service)->restore();

        return $this->respondSuccess(null, 'Service restored successfully.');
    }

    public function forceDestroy(string $service): JsonResponse
    {
        Service::withTrashed()->findOrFail($service)->forceDelete();

        return $this->respondSuccess(null, 'Service permanently deleted successfully.');
    }

    public function toggleActive(Service $service): JsonResponse
    {
        $service->update(['is_active' => ! $service->is_active]);

        return $this->respondSuccess(
            ['is_active' => $service->is_active],
            $service->is_active ? 'Service activated successfully.' : 'Service deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        Service::applyOrder($request->items());

        return $this->respondSuccess(null, 'Service order updated successfully.');
    }
}
