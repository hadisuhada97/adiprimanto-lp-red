<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\PainPointRequest;
use App\Http\Resources\PainPointResource;
use App\Models\PainPoint;

class PainPointController extends ContentModuleController
{
    protected array $searchTranslationColumns = ['title', 'description'];

    protected string $entityLabel = 'Pain point';

    protected function modelClass(): string
    {
        return PainPoint::class;
    }

    protected function resourceClass(): string
    {
        return PainPointResource::class;
    }

    protected function requestClass(): string
    {
        return PainPointRequest::class;
    }
}
