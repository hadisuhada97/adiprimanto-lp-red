<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseFormRequest;

class ResendTwoFactorCodeRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'challenge_token' => ['required', 'string', 'size:64'],
        ];
    }
}
