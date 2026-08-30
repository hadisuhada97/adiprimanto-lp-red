<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\ProcessStepRequest;
use App\Http\Resources\ProcessStepResource;
use App\Models\ProcessStep;

class ProcessStepController extends ContentModuleController
{
    protected array $searchTranslationColumns = ['title', 'description'];

    protected string $entityLabel = 'Process step';

    protected function modelClass(): string
    {
        return ProcessStep::class;
    }

    protected function resourceClass(): string
    {
        return ProcessStepResource::class;
    }

    protected function requestClass(): string
    {
        return ProcessStepRequest::class;
    }
}
