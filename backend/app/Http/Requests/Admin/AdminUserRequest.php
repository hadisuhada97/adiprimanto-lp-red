<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class AdminUserRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:120'],
            'email' => [
                $isUpdate ? 'sometimes' : 'required',
                'email',
                'max:191',
                Rule::unique('users', 'email')->ignore($this->route('id')),
            ],
            'password' => [$isUpdate ? 'nullable' : 'required', 'string', 'min:12', 'max:191'],
            'role_ids' => [$isUpdate ? 'sometimes' : 'required', 'array', 'min:1'],
            'role_ids.*' => ['uuid', 'exists:roles,id'],
            'is_active' => ['sometimes', 'boolean'],
            'is_two_factor_enabled' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.min' => 'The password must be at least 12 characters long.',
            'role_ids.min' => 'Please assign at least one role.',
        ];
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), ['role_ids' => 'roles']);
    }
}
