<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;

class Service extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = ServiceTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'is_featured' => 'boolean',
            'duration_days' => 'integer',
        ]);
    }
}
