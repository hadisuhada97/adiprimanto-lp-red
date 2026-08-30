<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactChannelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'value' => $this->value,
            'url' => $this->url,
            'icon_name' => $this->icon_name,
            'color_hex' => $this->color_hex,
            'label' => $this->translated('label'),
            'translations' => $this->translations->mapWithKeys(fn ($translation) => [
                $translation->locale => ['label' => $translation->label],
            ]),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
