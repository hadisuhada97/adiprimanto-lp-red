<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = TestimonialTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'rating' => 'integer',
            'is_featured' => 'boolean',
        ]);
    }

    public function avatar(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'avatar_media_id');
    }

    public function screenshot(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'screenshot_media_id');
    }
}
