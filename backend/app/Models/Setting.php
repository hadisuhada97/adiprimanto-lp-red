<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Support\Facades\Cache;

class Setting extends BaseModel
{
    public function revalidationTags(): array
    {
        return ['settings', 'landing'];
    }
    use HasTranslations;

    protected string $translationModel = SettingTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'value' => 'array',
            'is_public' => 'boolean',
        ]);
    }

    protected static function booted(): void
    {
        static::saved(fn (self $setting) => Cache::forget("settings.group.{$setting->group}"));
        static::deleted(fn (self $setting) => Cache::forget("settings.group.{$setting->group}"));
    }

    public static function group(string $group): array
    {
        return Cache::rememberForever(
            "settings.group.{$group}",
            fn () => self::query()->where('group', $group)->pluck('value', 'key')->all()
        );
    }

    public static function read(string $group, string $key, mixed $default = null): mixed
    {
        return self::group($group)[$key] ?? $default;
    }

    public static function write(string $group, string $key, mixed $value, string $type = 'string', bool $isPublic = true): self
    {
        return self::query()->updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value, 'type' => $type, 'is_public' => $isPublic]
        );
    }
}
