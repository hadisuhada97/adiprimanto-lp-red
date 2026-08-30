<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Client extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = ClientTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'is_featured' => 'boolean',
        ]);
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }
}
