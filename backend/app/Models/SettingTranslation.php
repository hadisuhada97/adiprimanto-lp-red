<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SettingTranslation extends BaseTranslationModel
{
    public function revalidationTags(): array
    {
        return ['settings', 'landing'];
    }
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public function setting(): BelongsTo
    {
        return $this->belongsTo(Setting::class);
    }
}
