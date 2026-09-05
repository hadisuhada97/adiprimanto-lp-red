<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\MediaFolderRequest;
use App\Http\Resources\MediaFolderResource;
use App\Models\MediaFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class MediaFolderController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $folders = MediaFolder::query()
            ->withCount('media')
            ->orderBy('name')
            ->get();

        return $this->respondSuccess(
            MediaFolderResource::collection($folders),
            'Folder list retrieved successfully.'
        );
    }

    public function store(MediaFolderRequest $request): JsonResponse
    {
        $folder = MediaFolder::query()->create([
            ...$request->validated(),
            'slug' => $this->uniqueSlug($request->string('name')->value(), $request->input('parent_id')),
        ]);

        return $this->respondCreated(new MediaFolderResource($folder), 'Folder created successfully.');
    }

    public function update(MediaFolderRequest $request, string $id): JsonResponse
    {
        $folder = MediaFolder::query()->findOrFail($id);
        $attributes = $request->validated();

        if (isset($attributes['name'])) {
            $attributes['slug'] = $this->uniqueSlug(
                $attributes['name'],
                $attributes['parent_id'] ?? $folder->parent_id,
                $folder->id
            );
        }

        $folder->update($attributes);

        return $this->respondSuccess(new MediaFolderResource($folder), 'Folder updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        $folder = MediaFolder::query()->withCount('media')->findOrFail($id);

        if ($folder->media_count > 0) {
            return $this->respondError(
                'This folder still contains files. Move or delete them first.',
                409
            );
        }

        $folder->delete();

        return $this->respondSuccess(null, 'Folder deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?string $parentId, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'folder';
        $slug = $base;
        $suffix = 2;

        while (MediaFolder::query()
            ->where('slug', $slug)
            ->where('parent_id', $parentId)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()
        ) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
