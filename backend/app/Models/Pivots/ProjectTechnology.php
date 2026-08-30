<?php

namespace App\Models\Pivots;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ProjectTechnology extends Pivot
{
    use HasUuids;

    public $incrementing = false;

    protected $table = 'project_technology';

    protected $keyType = 'string';
}
