<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;

class HeroMetric extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = HeroMetricTranslation::class;
}
