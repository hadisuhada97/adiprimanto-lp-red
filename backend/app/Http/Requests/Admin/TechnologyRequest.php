<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class TechnologyRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:191'],
            'slug' => [
                $isUpdate ? 'sometimes' : 'required',
                'string', 'max:191', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('technologies', 'slug')->ignore($this->route('technology')),
            ],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
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
