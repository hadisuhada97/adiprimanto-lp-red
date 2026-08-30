<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class SkillRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'skill_category_id' => ['nullable', 'uuid', 'exists:skill_categories,id'],
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:191'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'proficiency' => ['nullable', 'integer', 'between:0,100'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return ['color_hex.regex' => 'The colour must be a hex value such as #61dafb.'];
    }
}
