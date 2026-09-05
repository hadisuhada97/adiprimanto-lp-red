<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\MoveMediaRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends BaseApiController
{
    public function __construct(protected MediaService $media) {}

    public function index(Request $request): JsonResponse
    {
        $media = Media::query()
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('folder_id'), function ($query) use ($request) {
                return $request->string('folder_id')->value() === 'root'
                    ? $query->whereNull('folder_id')
                    : $query->where('folder_id', $request->string('folder_id'));
            })
            ->when($request->filled('search'), fn ($query) => $query->where(function ($inner) use ($request) {
                $term = '%'.$request->string('search').'%';
                $inner->where('original_name', 'like', $term)->orWhere('alt_text', 'like', $term);
            }))
            ->when($request->filled('type'), function ($query) use ($request) {
                return $request->string('type')->value() === 'image'
                    ? $query->where('mime_type', 'like', 'image/%')
                    : $query->where('mime_type', 'not like', 'image/%');
            })
            ->latest()
            ->paginate($this->perPage(24));

        return $this->respondPaginated(MediaResource::collection($media), 'Media retrieved successfully.');
    }

    public function store(UploadMediaRequest $request): JsonResponse
    {
        $media = $this->media->store(
            $request->file('file'),
            $request->input('folder_id'),
            $request->input('alt_text')
        );

        return $this->respondCreated(new MediaResource($media), 'File uploaded successfully.');
    }

    public function show(Media $medium): JsonResponse
    {
        return $this->respondSuccess(new MediaResource($medium), 'File retrieved successfully.');
    }

    public function usage(Media $medium): JsonResponse
    {
        $usage = $this->media->usage($medium);

        return $this->respondSuccess([
            'total' => array_sum(array_column($usage, 'count')),
            'references' => $usage,
        ], 'File usage retrieved successfully.');
    }

    public function update(UpdateMediaRequest $request, Media $medium): JsonResponse
    {
        $medium->update($request->validated());

        return $this->respondSuccess(new MediaResource($medium), 'File details updated successfully.');
    }

    public function move(MoveMediaRequest $request, Media $medium): JsonResponse
    {
        $medium->update(['folder_id' => $request->input('folder_id')]);

        return $this->respondSuccess(new MediaResource($medium->refresh()), 'File moved successfully.');
    }

    public function destroy(Media $medium): JsonResponse
    {
        $medium->delete();

        return $this->respondSuccess(null, 'File moved to trash successfully.');
    }

    public function restore(string $medium): JsonResponse
    {
        Media::onlyTrashed()->findOrFail($medium)->restore();

        return $this->respondSuccess(null, 'File restored successfully.');
    }

    public function forceDestroy(string $medium): JsonResponse
    {
        $media = Media::withTrashed()->findOrFail($medium);
        $usage = $this->media->usage($media);

        if ($usage !== []) {
            return $this->respondError(
                'This file is still used by '.implode(', ', array_column($usage, 'label')).'. Replace it there first.',
                409,
                ['references' => $usage]
            );
        }

        $media->forceDelete();

        return $this->respondSuccess(null, 'File permanently deleted successfully.');
    }
}
