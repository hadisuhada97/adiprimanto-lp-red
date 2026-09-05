<?php

namespace App\Http\Requests;

use App\Support\HtmlSanitizer;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

/**
 * Every request payload in this application must extend this class.
 * Guarantees a consistent 422 response shape, sanitised rich text and a
 * hard rejection of translatable fields sent outside `translations.{locale}`.
 */
abstract class BaseFormRequest extends FormRequest
{
    /** Rich text fields sanitised (allowlist) before validation. */
    protected array $richTextFields = [];

    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new ValidationException($validator);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizeRichText();
    }

    protected function sanitizeRichText(): void
    {
        if ($this->richTextFields === []) {
            return;
        }

        $input = $this->all();

        foreach ($this->richTextFields as $field) {
            if (is_string($input[$field] ?? null)) {
                $input[$field] = HtmlSanitizer::clean($input[$field]);
            }
        }

        foreach ((array) ($input['translations'] ?? []) as $locale => $attributes) {
            foreach ($this->richTextFields as $field) {
                if (is_array($attributes) && is_string($attributes[$field] ?? null)) {
                    $input['translations'][$locale][$field] = HtmlSanitizer::clean($attributes[$field]);
                }
            }
        }

        $this->replace($input);
    }

    /**
     * Adds a `prohibited` rule for every translatable field so a flat payload
     * fails loudly instead of being silently dropped.
     */
    protected function getValidatorInstance(): ValidatorContract
    {
        $validator = parent::getValidatorInstance();
        $rules = $this->container->call([$this, 'rules']);

        $guard = [];
        $messages = [];

        foreach (array_keys($rules) as $key) {
            if (! str_starts_with($key, 'translations.*.')) {
                continue;
            }

            $field = substr($key, strlen('translations.*.'));

            if (isset($rules[$field]) || isset($guard[$field])) {
                continue;
            }

            $guard[$field] = ['prohibited'];
            $messages["{$field}.prohibited"] = "Send {$field} inside translations.{locale} instead.";
        }

        if ($guard !== []) {
            $validator->addRules($guard);
            $validator->setCustomMessages($messages);
        }

        return $validator;
    }

    /** Friendlier names used inside validation messages. */
    public function attributes(): array
    {
        return [
            'website_url' => 'website URL',
            'url' => 'URL',
            'color_hex' => 'colour',
            'page_key' => 'page key',
            'icon_name' => 'icon name',
            'og_image_media_id' => 'social image',
            'logo_media_id' => 'logo',
            'profile_media_id' => 'profile photo',
            'photo_media_id' => 'photo',
            'skill_category_id' => 'category',
            'faq_category_id' => 'category',
            'location_lat' => 'latitude',
            'location_lng' => 'longitude',
        ];
    }

    /** Locale requested by the client, restricted to active locales. */
    protected function requestedLocale(): string
    {
        return $this->header('Accept-Language', $this->query('locale')) ?? config('app.fallback_locale');
    }
}
