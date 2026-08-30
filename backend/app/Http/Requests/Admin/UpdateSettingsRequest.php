<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;
use App\Models\Setting;

class UpdateSettingsRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.group' => ['required', 'string', 'max:64'],
            'items.*.key' => ['required', 'string', 'max:128'],
            'items.*.value' => ['present', 'nullable'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $known = Setting::query()
                ->get(['group', 'key'])
                ->map(fn (Setting $setting) => $setting->group.'.'.$setting->key)
                ->all();

            foreach ((array) $this->input('items', []) as $index => $item) {
                $reference = ($item['group'] ?? '').'.'.($item['key'] ?? '');

                if (! in_array($reference, $known, true)) {
                    $validator->errors()->add(
                        "items.{$index}.key",
                        "The setting \"{$reference}\" does not exist."
                    );
                }
            }
        });
    }

    /** @return array<int, array{group: string, key: string, value: mixed}> */
    public function items(): array
    {
        return $this->safe()->array('items');
    }
}
