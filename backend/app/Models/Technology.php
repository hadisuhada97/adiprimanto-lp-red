<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Technology extends BaseModel
{
    use HasSortOrder;

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_technology')
            ->using(\App\Models\Pivots\ProjectTechnology::class)
            ->withTimestamps();
    }
}
