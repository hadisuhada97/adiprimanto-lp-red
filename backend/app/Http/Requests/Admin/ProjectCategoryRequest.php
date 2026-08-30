<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class ProjectCategoryRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'slug' => [
                $isUpdate ? 'sometimes' : 'required',
                'string', 'max:191', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('project_categories', 'slug')->ignore($this->route('category')),
            ],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.name' => ['required', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, numbers and single hyphens.',
            'slug.unique' => 'This slug is already taken. It may belong to an item in the trash.',
        ];
    }
}
