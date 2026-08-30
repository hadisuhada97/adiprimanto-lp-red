<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class SkillCategoryRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'eyebrow' => ['nullable', 'string', 'max:16'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.name' => ['required', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.name.required' => 'The name is required for every language you fill in.',
        ];
    }
}
