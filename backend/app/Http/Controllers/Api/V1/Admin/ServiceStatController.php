<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\ServiceStatRequest;
use App\Http\Resources\ServiceStatResource;
use App\Models\ServiceStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceStatController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $stats = ServiceStat::query()
            ->with('translations')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->ordered()
            ->get();

        return $this->respondSuccess(
            ServiceStatResource::collection($stats),
            'Service stats retrieved successfully.'
        );
    }

    public function store(ServiceStatRequest $request): JsonResponse
    {
        $stat = DB::transaction(function () use ($request) {
            $stat = ServiceStat::query()->create($request->statAttributes());
            $stat->syncTranslations($request->translations());

            return $stat;
        });

        return $this->respondCreated(
            new ServiceStatResource($stat->refresh()->load('translations')),
            'Service stat created successfully.'
        );
    }

    public function update(ServiceStatRequest $request, ServiceStat $stat): JsonResponse
    {
        DB::transaction(function () use ($request, $stat) {
            $stat->update($request->statAttributes());

            if ($request->has('translations')) {
                $stat->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new ServiceStatResource($stat->fresh('translations')),
            'Service stat updated successfully.'
        );
    }

    public function destroy(ServiceStat $stat): JsonResponse
    {
        $stat->delete();

        return $this->respondSuccess(null, 'Service stat moved to trash successfully.');
    }

    public function restore(string $stat): JsonResponse
    {
        ServiceStat::onlyTrashed()->findOrFail($stat)->restore();

        return $this->respondSuccess(null, 'Service stat restored successfully.');
    }

    public function forceDestroy(string $stat): JsonResponse
    {
        ServiceStat::withTrashed()->findOrFail($stat)->forceDelete();

        return $this->respondSuccess(null, 'Service stat permanently deleted successfully.');
    }

    public function toggleActive(ServiceStat $stat): JsonResponse
    {
        $stat->update(['is_active' => ! $stat->is_active]);

        return $this->respondSuccess(
            ['is_active' => $stat->is_active],
            $stat->is_active ? 'Service stat activated successfully.' : 'Service stat deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        ServiceStat::applyOrder($request->items());

        return $this->respondSuccess(null, 'Service stat order updated successfully.');
    }
}
