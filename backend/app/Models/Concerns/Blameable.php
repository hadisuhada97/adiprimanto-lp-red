<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Tracks which authenticated user created and last updated the record.
 * Disable per model with `protected bool $blameable = false;`.
 */
trait Blameable
{
    public static function bootBlameable(): void
    {
        static::creating(function ($model): void {
            if (! $model->blameableEnabled()) {
                return;
            }

            $userId = Auth::id();
            $model->created_by ??= $userId;
            $model->updated_by ??= $userId;
        });

        static::updating(function ($model): void {
            if (! $model->blameableEnabled()) {
                return;
            }

            $model->updated_by = Auth::id() ?? $model->updated_by;
        });
    }

    public function blameableEnabled(): bool
    {
        return ! (property_exists($this, 'blameable') && $this->blameable === false);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }
}
