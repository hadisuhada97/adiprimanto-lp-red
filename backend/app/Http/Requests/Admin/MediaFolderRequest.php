<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class MediaFolderRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:120'],
            'parent_id' => ['nullable', 'uuid', 'exists:media_folders,id'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
