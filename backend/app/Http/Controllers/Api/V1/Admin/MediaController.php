<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $media = Media::query()
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
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
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = Str::uuid7()->toString().'.'.$extension;

        $path = $file->storeAs('media/'.now()->format('Y/m'), $fileName, 'public');

        $dimensions = @getimagesize($file->getRealPath());

        $media = Media::query()->create([
            'disk' => 'public',
            'path' => $path,
            'file_name' => $fileName,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'extension' => $extension,
            'size' => $file->getSize(),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'alt_text' => $request->input('alt_text'),
        ]);

        return $this->respondCreated(new MediaResource($media), 'File uploaded successfully.');
    }

    public function show(Media $medium): JsonResponse
    {
        return $this->respondSuccess(new MediaResource($medium), 'File retrieved successfully.');
    }

    public function update(UpdateMediaRequest $request, Media $medium): JsonResponse
    {
        $medium->update($request->validated());

        return $this->respondSuccess(new MediaResource($medium), 'File details updated successfully.');
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
        Media::withTrashed()->findOrFail($medium)->forceDelete();

        return $this->respondSuccess(null, 'File permanently deleted successfully.');
    }
}
