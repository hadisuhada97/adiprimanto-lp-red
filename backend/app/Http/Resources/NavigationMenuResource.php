<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NavigationMenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location' => $this->location,
            'parent_id' => $this->parent_id,
            'url' => $this->url,
            'anchor' => $this->anchor,
            'target' => $this->target,
            'label' => $this->translated('label'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['label' => $translation->label],
            ]),
            'children' => NavigationMenuResource::collection($this->whenLoaded('children')),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
