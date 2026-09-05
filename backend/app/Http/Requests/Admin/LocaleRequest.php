<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class LocaleRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'code' => [
                $isUpdate ? 'sometimes' : 'required',
                'string', 'min:2', 'max:5', 'regex:/^[a-z]{2}(-[A-Z]{2})?$/',
                Rule::unique('locales', 'code')->ignore($this->route('id')),
            ],
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:64'],
            'native_name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:64'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The locale code must look like “id” or “en-US”.',
            'code.unique' => 'This locale code already exists.',
        ];
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), ['native_name' => 'native name']);
    }
}
