<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class ServiceRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'icon_name' => ['nullable', 'string', 'max:64'],
            'price_from' => ['nullable', 'numeric', 'min:0', 'max:99999999999'],
            'price_currency' => ['nullable', 'string', 'size:3'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.title' => ['required', 'string', 'max:191'],
            'translations.*.description' => ['nullable', 'string', 'max:2000'],
            'translations.*.tags' => ['nullable', 'array', 'max:6'],
            'translations.*.tags.*' => ['string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.title.required' => 'The title is required for every language you fill in.',
        ];
    }

    public function serviceAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
