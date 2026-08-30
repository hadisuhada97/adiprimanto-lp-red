<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Base model for `{parent}_translations` tables.
 * Translations are physically removed with their parent, so no soft deletes here.
 */
abstract class BaseTranslationModel extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected bool $logsActivity = false;
}
