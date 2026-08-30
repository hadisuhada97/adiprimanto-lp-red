<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HeroSectionResource extends JsonResource
{
    /** @var string[] */
    public const FIELDS = [
        'badge',
        'role',
        'headline_line_1',
        'headline_highlight',
        'headline_stroke',
        'description_prefix',
        'description_strong',
        'description_suffix',
        'primary_cta_label',
        'secondary_cta_label',
        'trusted_prefix',
        'trusted_strong',
        'trusted_suffix',
    ];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'badge_icon' => $this->badge_icon,
            'primary_cta_url' => $this->primary_cta_url,
            'secondary_cta_url' => $this->secondary_cta_url,
            'profile_media_id' => $this->profile_media_id,
            'profile' => $this->whenLoaded('profile', fn () => $this->profile ? new MediaResource($this->profile) : null),
            'cv_media_id' => $this->cv_media_id,
            'cv' => $this->whenLoaded('cv', fn () => $this->cv ? new MediaResource($this->cv) : null),
            'is_active' => $this->is_active,
            'content' => collect(self::FIELDS)->mapWithKeys(fn (string $field) => [
                $field => $this->translated($field),
            ]),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => collect(self::FIELDS)->mapWithKeys(fn (string $field) => [
                    $field => $translation->getAttribute($field),
                ]),
            ]),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
