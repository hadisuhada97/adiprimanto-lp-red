<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\SocialLinkRequest;
use App\Http\Resources\SocialLinkResource;
use App\Models\SocialLink;

class SocialLinkController extends ContentModuleController
{
    protected array $relations = [];

    protected array $searchColumns = ['platform', 'url'];

    protected string $entityLabel = 'Social link';

    protected function modelClass(): string
    {
        return SocialLink::class;
    }

    protected function resourceClass(): string
    {
        return SocialLinkResource::class;
    }

    protected function requestClass(): string
    {
        return SocialLinkRequest::class;
    }
}
