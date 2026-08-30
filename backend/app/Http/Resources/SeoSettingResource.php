<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeoSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'page_key' => $this->page_key,
            'robots_directive' => $this->robots_directive,
            'structured_data' => $this->structured_data,
            'meta_title' => $this->translated('meta_title'),
            'meta_description' => $this->translated('meta_description'),
            'meta_keywords' => $this->translated('meta_keywords'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'meta_title' => $translation->meta_title,
                    'meta_description' => $translation->meta_description,
                    'meta_keywords' => $translation->meta_keywords,
                ],
            ]),
            'og_image_media_id' => $this->og_image_media_id,
            'og_image' => $this->whenLoaded('ogImage', fn () => $this->ogImage ? new MediaResource($this->ogImage) : null),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
