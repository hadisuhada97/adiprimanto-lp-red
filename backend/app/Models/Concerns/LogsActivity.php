<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Writes an audit trail entry for every create, update, delete and restore.
 */
trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(fn ($model) => $model->recordActivity('created', [], $model->getLoggableAttributes()));

        static::updated(function ($model): void {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if ($changes === []) {
                return;
            }

            $original = array_intersect_key($model->getOriginal(), $changes);

            $model->recordActivity('updated', $original, $changes);
        });

        static::deleted(function ($model): void {
            $action = method_exists($model, 'isForceDeleting') && $model->isForceDeleting()
                ? 'force_deleted'
                : 'deleted';

            $model->recordActivity($action, $model->getLoggableAttributes(), []);
        });

        if (method_exists(static::class, 'restored')) {
            static::restored(fn ($model) => $model->recordActivity('restored', [], $model->getLoggableAttributes()));
        }
    }

    public function recordActivity(string $action, array $oldValues = [], array $newValues = []): void
    {
        if ($this instanceof ActivityLog || $this->activityLoggingDisabled()) {
            return;
        }

        ActivityLog::query()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'subject_type' => static::class,
            'subject_id' => $this->getKey(),
            'old_values' => self::hideSensitive($oldValues),
            'new_values' => self::hideSensitive($newValues),
            'description' => sprintf('%s %s', class_basename(static::class), $action),
            'ip_address' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 512),
        ]);
    }

    public function getLoggableAttributes(): array
    {
        return self::hideSensitive($this->attributesToArray());
    }

    protected function activityLoggingDisabled(): bool
    {
        return property_exists($this, 'logsActivity') && $this->logsActivity === false;
    }

    protected static function hideSensitive(array $values): array
    {
        foreach (['password', 'remember_token', 'code_hash'] as $key) {
            if (array_key_exists($key, $values)) {
                $values[$key] = '[redacted]';
            }
        }

        return $values;
    }
}
