<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->translated('title'),
            'description' => $this->translated('description'),
            'tags' => $this->translated('tags') ?? [],
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'title' => $translation->title,
                    'description' => $translation->description,
                    'tags' => $translation->tags ?? [],
                ],
            ]),
            'icon_name' => $this->icon_name,
            'price_from' => $this->price_from === null ? null : (float) $this->price_from,
            'price_currency' => $this->price_currency,
            'duration_days' => $this->duration_days,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
