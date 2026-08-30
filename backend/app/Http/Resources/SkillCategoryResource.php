<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkillCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'eyebrow' => $this->eyebrow,
            'icon_name' => $this->icon_name,
            'name' => $this->translated('name'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['name' => $translation->name],
            ]),
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
            'skills_count' => $this->whenCounted('skills'),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
