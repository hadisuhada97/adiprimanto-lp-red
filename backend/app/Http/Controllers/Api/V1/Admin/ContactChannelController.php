<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\ContactChannelRequest;
use App\Http\Resources\ContactChannelResource;
use App\Models\ContactChannel;

class ContactChannelController extends ContentModuleController
{
    protected array $searchColumns = ['value', 'type'];

    protected array $searchTranslationColumns = ['label'];

    protected string $entityLabel = 'Contact channel';

    protected function modelClass(): string
    {
        return ContactChannel::class;
    }

    protected function resourceClass(): string
    {
        return ContactChannelResource::class;
    }

    protected function requestClass(): string
    {
        return ContactChannelRequest::class;
    }
}
