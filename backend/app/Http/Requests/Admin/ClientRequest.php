<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class ClientRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:191'],
            'logo_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'website_url' => ['nullable', 'url', 'max:2048'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'font_class' => ['nullable', 'string', 'max:191'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => ['sometimes', 'array'],
            'translations.*.description' => ['nullable', 'string', 'max:191'],
        ];
    }
}
