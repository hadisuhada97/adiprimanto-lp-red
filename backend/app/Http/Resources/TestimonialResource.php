<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TestimonialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->translated('name'),
            'role' => $this->translated('role'),
            'company' => $this->translated('company'),
            'project_label' => $this->translated('project_label'),
            'feedback' => $this->translated('feedback'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'name' => $translation->name,
                    'role' => $translation->role,
                    'company' => $translation->company,
                    'project_label' => $translation->project_label,
                    'feedback' => $translation->feedback,
                ],
            ]),
            'rating' => $this->rating,
            'accent_color' => $this->accent_color,
            'source' => $this->source,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'avatar_media_id' => $this->avatar_media_id,
            'avatar' => $this->whenLoaded('avatar', fn () => $this->avatar ? new MediaResource($this->avatar) : null),
            'screenshot_media_id' => $this->screenshot_media_id,
            'screenshot' => $this->whenLoaded('screenshot', fn () => $this->screenshot ? new MediaResource($this->screenshot) : null),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
