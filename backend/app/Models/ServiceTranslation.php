<?php

namespace App\Models;

class ServiceTranslation extends BaseTranslationModel
{
    protected function casts(): array
    {
        return [
            'tags' => 'array',
        ];
    }
}
