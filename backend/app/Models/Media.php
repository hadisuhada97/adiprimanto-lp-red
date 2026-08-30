<?php

namespace App\Models;

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
        ]);
    }

    public function getUrlAttribute(): string
    {
        return rtrim((string) config('app.url'), '/').'/api/storage/'.ltrim($this->path, '/');
    }

    protected static function booted(): void
    {
        static::forceDeleted(function (self $media): void {
            Storage::disk($media->disk)->delete($media->path);
        });
    }
}
