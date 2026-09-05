<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class UploadMediaRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,webp,gif,pdf'],
            'alt_text' => ['nullable', 'string', 'max:191'],
            'folder_id' => ['nullable', 'uuid', 'exists:media_folders,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.max' => 'The file may not be larger than 5 MB.',
            'file.mimes' => 'Only JPG, PNG, WEBP, GIF and PDF files are allowed.',
        ];
    }
}
