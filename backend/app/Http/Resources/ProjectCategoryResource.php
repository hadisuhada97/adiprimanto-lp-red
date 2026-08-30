<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'color_hex' => $this->color_hex,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'name' => $this->translated('name'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['name' => $translation->name],
            ]),
            'projects_count' => $this->whenCounted('projects'),
        ];
    }
}
