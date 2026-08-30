<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;

class ContactChannel extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = ContactChannelTranslation::class;
}
