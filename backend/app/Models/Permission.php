<?php

namespace App\Models;

use App\Models\Pivots\RolePermission;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends BaseModel
{
    protected bool $blameable = false;

    protected bool $logsActivity = false;

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
            ->using(RolePermission::class)
            ->withTimestamps();
    }
}
