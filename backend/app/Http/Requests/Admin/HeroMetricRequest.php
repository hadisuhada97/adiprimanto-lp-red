<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class HeroMetricRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'value' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:32'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.label' => ['required', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'color_hex.regex' => 'The colour must be a hex value such as #eab308.',
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.label.required' => 'The label is required for every language you fill in.',
        ];
    }

    public function metricAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
