<?php

namespace App\Http\Requests;

class ContactMessageRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:40'],
            'subject' => ['nullable', 'string', 'max:191'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            // Honeypot: hidden in the UI, so it must always arrive empty.
            'website' => ['nullable', 'string', 'max:0'],
        ];
    }

    public function messages(): array
    {
        if ($this->formLocale() !== 'id') {
            return ['website.max' => 'This submission looks automated.'];
        }

        return [
            'name.required' => 'Nama wajib diisi.',
            'name.max' => 'Nama maksimal 120 karakter.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'message.required' => 'Pesan wajib diisi.',
            'message.min' => 'Pesan minimal 10 karakter.',
            'message.max' => 'Pesan maksimal 5000 karakter.',
            'phone.max' => 'Nomor telepon maksimal 40 karakter.',
            'subject.max' => 'Subjek maksimal 191 karakter.',
            'website.max' => 'Pengiriman ini terdeteksi otomatis.',
        ];
    }

    /** Locale used for the human-readable messages returned to the public form. */
    public function formLocale(): string
    {
        $locale = (string) $this->query('locale', config('app.locale'));

        return in_array($locale, ['id', 'en'], true) ? $locale : 'en';
    }
}
