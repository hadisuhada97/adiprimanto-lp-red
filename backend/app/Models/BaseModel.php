<?php

namespace App\Models;

use App\Models\Concerns\Blameable;
use App\Models\Concerns\LogsActivity;
use App\Support\RevalidateFrontend;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Base model for every table in this application.
 * Enforces UUID v7 primary keys, soft deletes, blameable columns and audit logging.
 */
abstract class BaseModel extends Model
{
    use Blameable;
    use HasUuids;
    use LogsActivity;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected static function boot(): void
    {
        parent::boot();

        $revalidate = fn (self $model) => RevalidateFrontend::queue($model->revalidationTags());

        static::saved($revalidate);
        static::deleted($revalidate);
        static::restored($revalidate);
        static::forceDeleted($revalidate);
    }

    /**
     * Next.js cache tags invalidated when this record changes.
     * System models that never affect the public site override this with an empty array.
     *
     * @return array<int, string>
     */
    public function revalidationTags(): array
    {
        return ['landing'];
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
