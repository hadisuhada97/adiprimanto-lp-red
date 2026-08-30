<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Adds ordering helpers for models that expose a `sort_order` column.
 */
trait HasSortOrder
{
    public static function bootHasSortOrder(): void
    {
        static::creating(function ($model): void {
            if ($model->sort_order === null) {
                $model->sort_order = (int) static::query()->withTrashed()->max('sort_order') + 1;
            }
        });
    }

    public function scopeOrdered(Builder $query, string $direction = 'asc'): Builder
    {
        return $query->orderBy('sort_order', $direction)->orderBy('created_at', 'asc');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Persist a new order.
     *
     * @param  array<int, array{id: string, sort_order: int}>  $items
     */
    public static function applyOrder(array $items): int
    {
        $updated = 0;

        foreach ($items as $item) {
            $updated += static::query()
                ->whereKey($item['id'])
                ->update(['sort_order' => (int) $item['sort_order']]);
        }

        return $updated;
    }
}
