<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->translated('title'),
            'description' => $this->translated('description'),
            'content' => $this->translated('content'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => [
                    'title' => $translation->title,
                    'description' => $translation->description,
                    'content' => $translation->content,
                ],
            ]),
            'project_category_id' => $this->project_category_id,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->id,
                'slug' => $this->category?->slug,
                'name' => $this->category?->translated('name'),
                'color_hex' => $this->category?->color_hex,
            ]),
            'cover_media_id' => $this->cover_media_id,
            'cover' => $this->whenLoaded('cover', fn () => $this->cover ? new MediaResource($this->cover) : null),
            'technology_ids' => $this->whenLoaded('technologies', fn () => $this->technologies->pluck('id')),
            'technologies' => TechnologyResource::collection($this->whenLoaded('technologies')),
            'demo_url' => $this->demo_url,
            'github_url' => $this->github_url,
            'client_name' => $this->client_name,
            'year' => $this->year,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'published_at' => $this->published_at?->toIso8601String(),
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
