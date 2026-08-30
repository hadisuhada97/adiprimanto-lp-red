<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use Illuminate\Support\Facades\Cache;

class Locale extends BaseModel
{
    use HasSortOrder;

    protected bool $blameable = false;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'is_default' => 'boolean',
        ]);
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('locales.default_code'));
        static::deleted(fn () => Cache::forget('locales.default_code'));
    }

    public static function defaultCode(): string
    {
        return Cache::rememberForever(
            'locales.default_code',
            fn () => self::query()->where('is_default', true)->value('code') ?? config('app.fallback_locale')
        );
    }

    public static function activeCodes(): array
    {
        return self::query()->active()->ordered()->pluck('code')->all();
    }
}
