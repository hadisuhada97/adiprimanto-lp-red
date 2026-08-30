<?php

namespace App\Models\Pivots;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    use HasUuids;

    public $incrementing = false;

    protected $table = 'role_user';

    protected $keyType = 'string';
}
