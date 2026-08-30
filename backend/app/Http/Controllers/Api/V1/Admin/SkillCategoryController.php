<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\SkillCategoryRequest;
use App\Http\Resources\SkillCategoryResource;
use App\Models\SkillCategory;

class SkillCategoryController extends ContentModuleController
{
    protected array $relations = ['translations'];

    protected array $withCount = ['skills'];

    protected array $searchTranslationColumns = ['name'];

    protected string $entityLabel = 'Skill category';

    protected function modelClass(): string
    {
        return SkillCategory::class;
    }

    protected function resourceClass(): string
    {
        return SkillCategoryResource::class;
    }

    protected function requestClass(): string
    {
        return SkillCategoryRequest::class;
    }
}
