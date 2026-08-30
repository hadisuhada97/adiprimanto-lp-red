<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class NavigationMenuRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'location' => [$isUpdate ? 'sometimes' : 'required', Rule::in(['header', 'footer'])],
            'parent_id' => ['nullable', 'uuid', 'exists:navigation_menus,id'],
            'url' => ['nullable', 'string', 'max:2048'],
            'anchor' => ['nullable', 'string', 'max:191'],
            'target' => ['sometimes', Rule::in(['_self', '_blank'])],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.label' => ['required', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.label.required' => 'The label is required for every language you fill in.',
        ];
    }
}
