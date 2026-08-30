<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeroSection extends BaseModel
{
    use HasTranslations;

    protected string $translationModel = HeroSectionTranslation::class;

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'profile_media_id');
    }

    public function cv(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cv_media_id');
    }

    /** The hero is a singleton: always work with the first (or a freshly created) row. */
    public static function singleton(): self
    {
        return static::query()->first() ?? static::query()->create(['is_active' => true]);
    }
}
