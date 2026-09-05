<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends BaseModel
{
    protected $table = 'media';

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'variants' => 'array',
        ]);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    public function getUrlAttribute(): string
    {
        return $this->publicUrl($this->path);
    }

    /** Derived WebP/thumbnail URL, falling back to the original file. */
    public function variantUrl(string $key): string
    {
        $path = $this->variants[$key] ?? null;

        return $this->publicUrl(is_string($path) ? $path : $this->path);
    }

    protected function publicUrl(string $path): string
    {
        return rtrim((string) config('app.url'), '/').'/api/storage/'.ltrim($path, '/');
    }

    protected static function booted(): void
    {
        static::forceDeleted(function (self $media): void {
            $disk = Storage::disk($media->disk);
            $disk->delete($media->path);

            foreach ((array) $media->variants as $path) {
                if (is_string($path) && $path !== $media->path) {
                    $disk->delete($path);
                }
            }
        });
    }
}
