<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Faq extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = FaqTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'is_featured' => 'boolean',
        ]);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }
}
