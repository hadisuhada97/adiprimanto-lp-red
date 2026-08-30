<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends BaseModel
{
    protected bool $blameable = false;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'read_at' => 'datetime',
            'replied_at' => 'datetime',
        ]);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
