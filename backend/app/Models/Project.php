<?php

namespace App\Models;

use App\Models\Concerns\HasSortOrder;
use App\Models\Concerns\HasTranslations;
use App\Models\Pivots\ProjectTechnology;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Project extends BaseModel
{
    use HasSortOrder;
    use HasTranslations;

    protected string $translationModel = ProjectTranslation::class;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'is_featured' => 'boolean',
            'year' => 'integer',
            'published_at' => 'datetime',
        ]);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProjectCategory::class, 'project_category_id');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class, 'project_technology')
            ->using(ProjectTechnology::class)
            ->withTimestamps();
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('status', 'published')
            ->where(fn (Builder $inner) => $inner->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    protected static function booted(): void
    {
        static::saving(function (self $project): void {
            if ($project->status === 'published' && $project->published_at === null) {
                $project->published_at = now();
            }
        });
    }
}
