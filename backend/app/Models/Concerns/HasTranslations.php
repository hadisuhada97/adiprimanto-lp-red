<?php

namespace App\Models\Concerns;

use App\Models\Locale;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Multi-language support backed by a dedicated `{model}_translations` table,
 * one row per locale, with automatic fallback to the default locale.
 */
trait HasTranslations
{
    public function translations(): HasMany
    {
        return $this->hasMany($this->translationModelClass(), $this->translationForeignKey());
    }

    public function translation(?string $locale = null): HasOne
    {
        return $this->hasOne($this->translationModelClass(), $this->translationForeignKey())
            ->where('locale', $locale ?? app()->getLocale());
    }

    /** Resolve the translation for a locale, falling back to the default locale. */
    public function translate(?string $locale = null): ?Model
    {
        $locale ??= app()->getLocale();
        $translations = $this->relationLoaded('translations')
            ? $this->getRelation('translations')
            : $this->translations()->get();

        return $translations->firstWhere('locale', $locale)
            ?? $translations->firstWhere('locale', Locale::defaultCode())
            ?? $translations->first();
    }

    /** Read a single translated attribute, falling back per field to the default locale. */
    public function translated(string $attribute, ?string $locale = null): mixed
    {
        $value = $this->translate($locale)?->getAttribute($attribute);

        if ($value !== null && $value !== '' && $value !== []) {
            return $value;
        }

        return $this->translate(Locale::defaultCode())?->getAttribute($attribute) ?? $value;
    }

    /**
     * Create or update translations.
     *
     * @param  array<string, array<string, mixed>>  $payload  keyed by locale
     */
    public function syncTranslations(array $payload): void
    {
        foreach ($payload as $locale => $attributes) {
            $this->translations()->updateOrCreate(
                ['locale' => $locale],
                $attributes
            );
        }

        $this->unsetRelation('translations');
    }

    public function translationModelClass(): string
    {
        return property_exists($this, 'translationModel')
            ? $this->translationModel
            : static::class.'Translation';
    }

    public function translationForeignKey(): string
    {
        return property_exists($this, 'translationForeignKey')
            ? $this->translationForeignKey
            : $this->getForeignKey();
    }

    /** Locales that already have a translation row. */
    public function translatedLocales(): array
    {
        return $this->translations()->pluck('locale')->all();
    }
}
