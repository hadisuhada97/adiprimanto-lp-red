<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'website_url' => $this->website_url,
            'icon_name' => $this->icon_name,
            'font_class' => $this->font_class,
            'is_featured' => $this->is_featured,
            'description' => $this->translated('description'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['description' => $translation->description],
            ]),
            'logo_media_id' => $this->logo_media_id,
            'logo' => $this->whenLoaded('logo', fn () => $this->logo ? new MediaResource($this->logo) : null),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
