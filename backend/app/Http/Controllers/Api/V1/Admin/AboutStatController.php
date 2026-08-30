<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\AboutStatRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\AboutStatResource;
use App\Models\AboutStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AboutStatController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $stats = AboutStat::query()
            ->with('translations')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->ordered()
            ->get();

        return $this->respondSuccess(
            AboutStatResource::collection($stats),
            'About stats retrieved successfully.'
        );
    }

    public function store(AboutStatRequest $request): JsonResponse
    {
        $stat = DB::transaction(function () use ($request) {
            $stat = AboutStat::query()->create($request->statAttributes());
            $stat->syncTranslations($request->translations());

            return $stat;
        });

        return $this->respondCreated(
            new AboutStatResource($stat->refresh()->load('translations')),
            'About stat created successfully.'
        );
    }

    public function update(AboutStatRequest $request, AboutStat $stat): JsonResponse
    {
        DB::transaction(function () use ($request, $stat) {
            $stat->update($request->statAttributes());

            if ($request->has('translations')) {
                $stat->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new AboutStatResource($stat->fresh('translations')),
            'About stat updated successfully.'
        );
    }

    public function destroy(AboutStat $stat): JsonResponse
    {
        $stat->delete();

        return $this->respondSuccess(null, 'About stat moved to trash successfully.');
    }

    public function restore(string $stat): JsonResponse
    {
        AboutStat::onlyTrashed()->findOrFail($stat)->restore();

        return $this->respondSuccess(null, 'About stat restored successfully.');
    }

    public function forceDestroy(string $stat): JsonResponse
    {
        AboutStat::withTrashed()->findOrFail($stat)->forceDelete();

        return $this->respondSuccess(null, 'About stat permanently deleted successfully.');
    }

    public function toggleActive(AboutStat $stat): JsonResponse
    {
        $stat->update(['is_active' => ! $stat->is_active]);

        return $this->respondSuccess(
            ['is_active' => $stat->is_active],
            $stat->is_active ? 'About stat activated successfully.' : 'About stat deactivated successfully.'
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        AboutStat::applyOrder($request->items());

        return $this->respondSuccess(null, 'About stat order updated successfully.');
    }
}
