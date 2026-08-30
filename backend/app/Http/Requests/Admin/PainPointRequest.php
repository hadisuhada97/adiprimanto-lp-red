<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class PainPointRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'icon_name' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.title' => ['required', 'string', 'max:191'],
            'translations.*.description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.title.required' => 'The title is required for every language you fill in.',
        ];
    }
}
