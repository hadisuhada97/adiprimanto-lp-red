<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class RoleController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $roles = Role::query()->with('permissions')->withCount('users')->orderBy('name')->get();

        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('action')
            ->get()
            ->groupBy('module')
            ->map(fn ($group, $module) => [
                'module' => $module,
                'label' => Str::headline($module),
                'permissions' => $group->map(fn (Permission $permission) => [
                    'id' => $permission->id,
                    'slug' => $permission->slug,
                    'action' => $permission->action,
                ])->values(),
            ])
            ->values();

        return $this->respondSuccess([
            'roles' => RoleResource::collection($roles),
            'modules' => $permissions,
        ], 'Roles retrieved successfully.');
    }
}
