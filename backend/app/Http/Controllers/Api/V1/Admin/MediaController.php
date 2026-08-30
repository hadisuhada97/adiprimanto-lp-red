<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
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
            ->when($request->filled('search'), fn ($query) => $query->where('original_name', 'like', '%'.$request->string('search').'%'))
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

    public function destroy(Media $medium): JsonResponse
    {
        $medium->delete();

        return $this->respondSuccess(null, 'File moved to trash successfully.');
    }
}
