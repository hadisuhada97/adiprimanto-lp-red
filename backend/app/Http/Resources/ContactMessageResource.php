<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'internal_note' => $this->internal_note,
            'ip_address' => $this->ip_address,
            'referrer' => $this->referrer,
            'read_at' => $this->read_at?->toIso8601String(),
            'replied_at' => $this->replied_at?->toIso8601String(),
            'handled_by' => $this->handled_by,
            'handler' => $this->whenLoaded('handler', fn () => $this->handler?->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
