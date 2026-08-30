<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\SkillRequest;
use App\Http\Resources\SkillResource;
use App\Models\Skill;

class SkillController extends ContentModuleController
{
    protected array $relations = ['category.translations'];

    protected ?array $parentOrder = ['skill_categories', 'skills.skill_category_id'];

    protected array $preOrderColumns = [];

    protected array $searchColumns = ['name'];

    protected array $filterColumns = ['category_id' => 'skill_category_id'];

    protected string $entityLabel = 'Skill';

    protected function modelClass(): string
    {
        return Skill::class;
    }

    protected function resourceClass(): string
    {
        return SkillResource::class;
    }

    protected function requestClass(): string
    {
        return SkillRequest::class;
    }
}
