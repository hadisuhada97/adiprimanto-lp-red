<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = SkillCategoryTranslation::class;

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class, 'skill_category_id');
    }
}
