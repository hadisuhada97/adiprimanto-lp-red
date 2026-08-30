<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class AboutStatRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'value' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:32'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.label' => ['required', 'string', 'max:191'],
            'translations.*.sublabel' => ['nullable', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.label.required' => 'The label is required for every language you fill in.',
        ];
    }

    public function statAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
