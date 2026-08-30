<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class ServiceStatRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'value' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:32'],
            'icon_name' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.unit' => ['nullable', 'string', 'max:191'],
            'translations.*.label' => ['nullable', 'string', 'max:191'],
        ];
    }

    public function statAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
