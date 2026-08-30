<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class HeroSectionRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'badge_icon' => ['nullable', 'string', 'max:64'],
            'profile_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'cv_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'primary_cta_url' => ['nullable', 'string', 'max:2048'],
            'secondary_cta_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],

            'translations' => ['sometimes', 'array'],
            'translations.*.badge' => ['nullable', 'string', 'max:191'],
            'translations.*.role' => ['nullable', 'string', 'max:191'],
            'translations.*.headline_line_1' => ['nullable', 'string', 'max:191'],
            'translations.*.headline_highlight' => ['nullable', 'string', 'max:191'],
            'translations.*.headline_stroke' => ['nullable', 'string', 'max:191'],
            'translations.*.description_prefix' => ['nullable', 'string', 'max:191'],
            'translations.*.description_strong' => ['nullable', 'string', 'max:191'],
            'translations.*.description_suffix' => ['nullable', 'string', 'max:191'],
            'translations.*.primary_cta_label' => ['nullable', 'string', 'max:191'],
            'translations.*.secondary_cta_label' => ['nullable', 'string', 'max:191'],
            'translations.*.trusted_prefix' => ['nullable', 'string', 'max:191'],
            'translations.*.trusted_strong' => ['nullable', 'string', 'max:191'],
            'translations.*.trusted_suffix' => ['nullable', 'string', 'max:191'],
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
