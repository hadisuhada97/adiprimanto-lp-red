<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class ProjectRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $projectId = $this->route('project');
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'slug' => [
                $isUpdate ? 'sometimes' : 'required',
                'string', 'max:191', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('projects', 'slug')->ignore($projectId),
            ],
            'project_category_id' => ['nullable', 'uuid', 'exists:project_categories,id'],
            'cover_media_id' => ['nullable', 'uuid', 'exists:media,id'],
            'demo_url' => ['nullable', 'url', 'max:2048'],
            'github_url' => ['nullable', 'url', 'max:2048'],
            'client_name' => ['nullable', 'string', 'max:191'],
            'year' => ['nullable', 'integer', 'min:1990', 'max:2100'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'technology_ids' => ['sometimes', 'array'],
            'technology_ids.*' => ['uuid', 'exists:technologies,id'],

            'translations' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'translations.*.title' => ['required', 'string', 'max:191'],
            'translations.*.description' => ['nullable', 'string', 'max:1000'],
            'translations.*.content' => ['nullable', 'string', 'max:20000'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, numbers and single hyphens.',
            'slug.unique' => 'This slug is already taken. It may belong to an item in the trash.',
            'translations.required' => 'At least one language must be filled in.',
            'translations.*.title.required' => 'The title is required for every language you fill in.',
        ];
    }

    /** Attributes that belong on the projects table. */
    public function projectAttributes(): array
    {
        return $this->safe()->except(['translations', 'technology_ids']);
    }

    public function translations(): array
    {
        return $this->safe()->array('translations');
    }
}
