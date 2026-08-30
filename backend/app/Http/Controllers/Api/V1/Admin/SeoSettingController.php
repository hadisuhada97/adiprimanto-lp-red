<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\SeoSettingRequest;
use App\Http\Resources\SeoSettingResource;
use App\Models\SeoSetting;

class SeoSettingController extends ContentModuleController
{
    protected array $relations = ['translations', 'ogImage'];

    protected array $searchColumns = ['page_key'];

    protected array $searchTranslationColumns = ['meta_title', 'meta_description'];

    protected string $entityLabel = 'SEO entry';

    protected function modelClass(): string
    {
        return SeoSetting::class;
    }

    protected function resourceClass(): string
    {
        return SeoSettingResource::class;
    }

    protected function requestClass(): string
    {
        return SeoSettingRequest::class;
    }
}
