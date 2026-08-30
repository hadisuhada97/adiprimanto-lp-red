<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseFormRequest;

class VerifyTwoFactorCodeRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $length = (int) config('two_factor.code_length');

        return [
            'challenge_token' => ['required', 'string', 'size:64'],
            'code' => ['required', 'string', 'size:'.$length, 'regex:/^[0-9]+$/'],
            'device_name' => ['sometimes', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The verification code must contain digits only.',
            'code.size' => 'The verification code must be exactly :size digits.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => preg_replace('/\s+/', '', (string) $this->input('code'))]);
        }
    }

    public function deviceName(): string
    {
        return $this->string('device_name', 'admin-panel')->value();
    }
}
