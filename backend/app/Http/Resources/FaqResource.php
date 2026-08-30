<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FaqResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->translated('question'),
            'answer' => $this->translated('answer'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'question' => $translation->question,
                    'answer' => $translation->answer,
                ],
            ]),
            'faq_category_id' => $this->faq_category_id,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'slug' => $this->category->slug,
                'name' => $this->category->translated('name'),
            ] : null),
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
