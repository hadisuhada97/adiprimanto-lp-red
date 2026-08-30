<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FaqCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['name' => $translation->name],
            ]),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'faqs_count' => $this->whenCounted('faqs'),
            'faqs' => FaqResource::collection($this->whenLoaded('faqs')),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
