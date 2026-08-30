<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class TestimonialRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'avatar_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'screenshot_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'rating' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'min:1', 'max:5'],
            'accent_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'source' => ['sometimes', Rule::in(['whatsapp', 'email', 'manual'])],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.name' => ['required', 'string', 'max:191'],
            'translations.*.role' => ['nullable', 'string', 'max:191'],
            'translations.*.company' => ['nullable', 'string', 'max:191'],
            'translations.*.project_label' => ['nullable', 'string', 'max:191'],
            'translations.*.feedback' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.name.required' => 'The client name is required for every language you fill in.',
            'translations.*.feedback.required' => 'The feedback is required for every language you fill in.',
            'accent_color.regex' => 'The accent colour must be a hex value such as #ef4444.',
        ];
    }

    public function testimonialAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
