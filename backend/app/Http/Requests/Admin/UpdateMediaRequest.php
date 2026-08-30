<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class UpdateMediaRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'alt_text' => ['nullable', 'string', 'max:191'],
            'caption' => ['nullable', 'string', 'max:191'],
        ];
    }
}
