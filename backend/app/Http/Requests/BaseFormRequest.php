<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

/**
 * Every request payload in this application must extend this class.
 * Guarantees a consistent 422 response shape and trimmed input.
 */
abstract class BaseFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new ValidationException($validator);
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
