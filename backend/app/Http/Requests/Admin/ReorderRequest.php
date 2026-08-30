<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseFormRequest;

class ReorderRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    /** @return array<int, array{id: string, sort_order: int}> */
    public function items(): array
    {
        return $this->safe()->array('items');
    }
}
