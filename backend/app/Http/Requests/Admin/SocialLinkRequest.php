<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class SocialLinkRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'platform' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:64'],
            'url' => [$isUpdate ? 'sometimes' : 'required', 'url', 'max:2048'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return ['color_hex.regex' => 'The colour must be a hex value such as #0a66c2.'];
    }
}
