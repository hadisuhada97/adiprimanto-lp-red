<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class FaqRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'faq_category_id' => ['nullable', 'uuid', 'exists:faq_categories,id'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.question' => ['required', 'string', 'max:191'],
            'translations.*.answer' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.question.required' => 'The question is required for every language you fill in.',
            'translations.*.answer.required' => 'The answer is required for every language you fill in.',
        ];
    }

    public function faqAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
