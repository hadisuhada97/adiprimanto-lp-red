<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Http\Resources\MediaResource;
use App\Http\Resources\SettingResource;
use App\Models\Media;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $settings = Setting::query()
            ->when($request->filled('group'), fn ($query) => $query->where('group', $request->string('group')))
            ->orderBy('group')
            ->orderBy('sort_order')
            ->orderBy('key')
            ->get();

        $mediaIds = $settings
            ->where('type', 'media')
            ->pluck('value')
            ->filter(fn ($value) => is_string($value) && $value !== '')
            ->unique()
            ->all();

        $media = $mediaIds === []
            ? collect()
            : Media::query()->whereIn('id', $mediaIds)->get();

        return $this->respondSuccess([
            'items' => SettingResource::collection($settings),
            'media' => MediaResource::collection($media),
        ], 'Settings retrieved successfully.');
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->items() as $item) {
                Setting::query()
                    ->where('group', $item['group'])
                    ->where('key', $item['key'])
                    ->first()
                    ?->update(['value' => $item['value']]);
            }
        });

        return $this->respondSuccess(null, 'Settings saved successfully.');
    }
}
