<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ActivityLogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::query()
            ->with('user')
            ->when($request->filled('user_id'), fn ($query) => $query->where('user_id', $request->string('user_id')))
            ->when($request->filled('action'), fn ($query) => $query->where('action', $request->string('action')))
            ->when($request->filled('subject_type'), fn ($query) => $query->where(
                'subject_type',
                'like',
                '%'.$request->string('subject_type')
            ))
            ->when($request->filled('from'), fn ($query) => $query->where('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($query) => $query->where('created_at', '<=', $request->date('to')))
            ->latest('created_at')
            ->paginate($this->perPage(25));

        return $this->respondPaginated(
            ActivityLogResource::collection($logs),
            'Activity log retrieved successfully.'
        );
    }

    public function filters(): JsonResponse
    {
        return $this->respondSuccess([
            'actions' => ActivityLog::query()->distinct()->orderBy('action')->pluck('action'),
            'modules' => ActivityLog::query()
                ->whereNotNull('subject_type')
                ->distinct()
                ->pluck('subject_type')
                ->map(fn (string $type) => [
                    'value' => class_basename($type),
                    'label' => Str::headline(class_basename($type)),
                ])
                ->unique('value')
                ->sortBy('label')
                ->values(),
        ], 'Activity log filters retrieved successfully.');
    }
}
