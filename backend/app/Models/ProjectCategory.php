<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectCategory extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = ProjectCategoryTranslation::class;

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
