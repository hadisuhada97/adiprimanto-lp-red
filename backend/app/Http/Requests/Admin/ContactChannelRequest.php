<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class ContactChannelRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'type' => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in(['whatsapp', 'email', 'instagram', 'linkedin', 'github', 'custom']),
            ],
            'value' => ['nullable', 'string', 'max:191'],
            'url' => ['nullable', 'string', 'max:2048'],
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
            'color_hex.regex' => 'The colour must be a hex value such as #25d366.',
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.label.required' => 'The label is required for every language you fill in.',
        ];
    }
}
