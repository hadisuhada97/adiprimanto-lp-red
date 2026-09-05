<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class SeoSettingRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'page_key' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9]+(?:[-\/][a-z0-9]+)*$/',
                Rule::unique('seo_settings', 'page_key')->ignore($this->route('id')),
            ],
            'og_image_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'robots_directive' => ['sometimes', 'string', 'max:64'],
            'structured_data' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:191'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
            'translations.*.meta_keywords' => ['nullable', 'string', 'max:191'],

            // Translatable fields only belong inside `translations.{locale}`.
            'meta_title' => ['prohibited'],
            'meta_description' => ['prohibited'],
            'meta_keywords' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'page_key.regex' => 'The page key may only contain lowercase letters, numbers, hyphens and slashes.',
            'translations.required' => 'At least one language must be filled in.',
            'meta_title.prohibited' => 'Send meta_title inside translations.{locale} instead.',
            'meta_description.prohibited' => 'Send meta_description inside translations.{locale} instead.',
            'meta_keywords.prohibited' => 'Send meta_keywords inside translations.{locale} instead.',
        ];
    }
}
