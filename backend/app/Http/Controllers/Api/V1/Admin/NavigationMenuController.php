<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\NavigationMenuRequest;
use App\Http\Resources\NavigationMenuResource;
use App\Models\NavigationMenu;

class NavigationMenuController extends ContentModuleController
{
    protected array $searchTranslationColumns = ['label'];

    protected array $filterColumns = ['location' => 'location'];

    protected string $entityLabel = 'Menu item';

    protected function modelClass(): string
    {
        return NavigationMenu::class;
    }

    protected function resourceClass(): string
    {
        return NavigationMenuResource::class;
    }

    protected function requestClass(): string
    {
        return NavigationMenuRequest::class;
    }
}
