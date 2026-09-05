<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class MoveMediaRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'folder_id' => ['present', 'nullable', 'uuid', 'exists:media_folders,id'],
        ];
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), ['folder_id' => 'folder']);
    }
}
