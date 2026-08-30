<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProcessStepResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'icon_name' => $this->icon_name,
            'step_number' => $this->step_number,
            'title' => $this->translated('title'),
            'description' => $this->translated('description'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'title' => $translation->title,
                    'description' => $translation->description,
                ],
            ]),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
