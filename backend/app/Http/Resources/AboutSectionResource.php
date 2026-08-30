<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AboutSectionResource extends JsonResource
{
    /** @var string[] */
    public const FIELDS = [
        'eyebrow',
        'location',
        'headline',
        'headline_highlight',
        'bio_paragraph_1',
        'bio_paragraph_2',
        'bio_paragraph_3',
        'primary_cta_label',
        'secondary_cta_label',
    ];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_lat' => $this->location_lat,
            'location_lng' => $this->location_lng,
            'primary_cta_url' => $this->primary_cta_url,
            'secondary_cta_url' => $this->secondary_cta_url,
            'photo_media_id' => $this->photo_media_id,
            'photo' => $this->whenLoaded('photo', fn () => $this->photo ? new MediaResource($this->photo) : null),
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
