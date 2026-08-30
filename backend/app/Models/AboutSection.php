<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AboutSection extends BaseModel
{
    use HasTranslations;

    protected string $translationModel = AboutSectionTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'location_lat' => 'float',
            'location_lng' => 'float',
        ]);
    }

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    /** The about section is a singleton: always work with the first (or a freshly created) row. */
    public static function singleton(): self
    {
        return static::query()->first() ?? static::query()->create(['is_active' => true]);
    }
}
