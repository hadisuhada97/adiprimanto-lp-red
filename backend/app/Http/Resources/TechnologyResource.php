<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TechnologyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon_name' => $this->icon_name,
            'color_hex' => $this->color_hex,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
