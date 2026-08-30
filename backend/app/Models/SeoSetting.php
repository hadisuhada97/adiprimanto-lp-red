<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoSetting extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = SeoSettingTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'structured_data' => 'array',
        ]);
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'og_image_media_id');
    }
}
