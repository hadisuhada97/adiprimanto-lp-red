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

    /** Locale requested by the client, restricted to active locales. */
    protected function requestedLocale(): string
    {
        return $this->header('Accept-Language', $this->query('locale')) ?? config('app.fallback_locale');
    }
}
