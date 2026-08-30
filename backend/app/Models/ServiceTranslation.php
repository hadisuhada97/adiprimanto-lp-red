<?php

namespace App\Models;

class ServiceTranslation extends BaseTranslationModel
{
    protected $casts = [
        'tags' => 'array',
    ];
}
