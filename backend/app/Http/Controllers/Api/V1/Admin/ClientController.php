<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;

class ClientController extends ContentModuleController
{
    protected array $relations = ['translations', 'logo'];

    protected array $searchColumns = ['name'];

    protected array $searchTranslationColumns = ['description'];

    protected string $entityLabel = 'Client';

    protected function modelClass(): string
    {
        return Client::class;
    }

    protected function resourceClass(): string
    {
        return ClientResource::class;
    }

    protected function requestClass(): string
    {
        return ClientRequest::class;
    }
}
