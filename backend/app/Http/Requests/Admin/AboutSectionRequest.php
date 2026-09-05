<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class AboutSectionRequest extends BaseFormRequest
{
    protected array $richTextFields = ['bio_paragraph_1', 'bio_paragraph_2', 'bio_paragraph_3'];

    public function rules(): array
    {
        return [
            'photo_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'location_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'location_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'primary_cta_url' => ['nullable', 'string', 'max:2048'],
            'secondary_cta_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],

            'translations' => ['sometimes', 'array'],
            'translations.*.eyebrow' => ['nullable', 'string', 'max:191'],
            'translations.*.location' => ['nullable', 'string', 'max:191'],
            'translations.*.headline' => ['nullable', 'string', 'max:191'],
            'translations.*.headline_highlight' => ['nullable', 'string', 'max:191'],
            'translations.*.bio_paragraph_1' => ['nullable', 'string', 'max:2000'],
            'translations.*.bio_paragraph_2' => ['nullable', 'string', 'max:2000'],
            'translations.*.bio_paragraph_3' => ['nullable', 'string', 'max:2000'],
            'translations.*.primary_cta_label' => ['nullable', 'string', 'max:191'],
            'translations.*.secondary_cta_label' => ['nullable', 'string', 'max:191'],
        ];
    }

    public function sectionAttributes(): array
    {
        return $this->safe()->except(['translations']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
