<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class ContactMessageUpdateRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(['new', 'read', 'replied', 'spam', 'archived'])],
            'internal_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
