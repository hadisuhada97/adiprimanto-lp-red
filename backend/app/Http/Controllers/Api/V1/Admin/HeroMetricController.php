<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\HeroMetricRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\HeroMetricResource;
use App\Models\HeroMetric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HeroMetricController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $metrics = HeroMetric::query()
            ->with('translations')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->ordered()
            ->get();

        return $this->respondSuccess(
            HeroMetricResource::collection($metrics),
            'Hero metrics retrieved successfully.'
        );
    }

    public function store(HeroMetricRequest $request): JsonResponse
    {
        $metric = DB::transaction(function () use ($request) {
            $metric = HeroMetric::query()->create($request->metricAttributes());
            $metric->syncTranslations($request->translations());

            return $metric;
        });

        return $this->respondCreated(
            new HeroMetricResource($metric->refresh()->load('translations')),
            'Hero metric created successfully.'
        );
    }

    public function update(HeroMetricRequest $request, HeroMetric $metric): JsonResponse
    {
        DB::transaction(function () use ($request, $metric) {
            $metric->update($request->metricAttributes());

            if ($request->has('translations')) {
                $metric->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new HeroMetricResource($metric->fresh('translations')),
            'Hero metric updated successfully.'
        );
    }

    public function destroy(HeroMetric $metric): JsonResponse
    {
        $metric->delete();

        return $this->respondSuccess(null, 'Hero metric moved to trash successfully.');
    }

    public function restore(string $metric): JsonResponse
    {
        HeroMetric::onlyTrashed()->findOrFail($metric)->restore();

        return $this->respondSuccess(null, 'Hero metric restored successfully.');
    }

    public function forceDestroy(string $metric): JsonResponse
    {
        HeroMetric::withTrashed()->findOrFail($metric)->forceDelete();

        return $this->respondSuccess(null, 'Hero metric permanently deleted successfully.');
    }

    public function toggleActive(HeroMetric $metric): JsonResponse
    {
        $metric->update(['is_active' => ! $metric->is_active]);

        return $this->respondSuccess(
            ['is_active' => $metric->is_active],
            $metric->is_active ? 'Hero metric activated successfully.' : 'Hero metric deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        HeroMetric::applyOrder($request->items());

        return $this->respondSuccess(null, 'Hero metric order updated successfully.');
    }
}
