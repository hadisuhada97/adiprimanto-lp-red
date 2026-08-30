<?php

namespace Database\Seeders;

use App\Enums\ModuleKey;
use App\Enums\PermissionAction;
use App\Enums\RoleSlug;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (RoleSlug::cases() as $slug) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug->value],
                [
                    'name' => $slug->label(),
                    'description' => $slug->description(),
                    'is_system' => true,
                ]
            );

            $role->syncPermissionSlugs($this->permissionSlugsFor($slug));
        }
    }

    protected function permissionSlugsFor(RoleSlug $slug): array
    {
        $all = Permission::query()->pluck('slug')->all();

        return match ($slug) {
            RoleSlug::SuperAdmin => $all,

            RoleSlug::Admin => array_values(array_filter(
                $all,
                fn (string $permission) => ! $this->matches($permission, [
                    ModuleKey::Users->value,
                    ModuleKey::Roles->value,
                ]) && ! str_ends_with($permission, '.'.PermissionAction::ForceDelete->value)
            )),

            RoleSlug::Editor => array_values(array_filter(
                $all,
                fn (string $permission) => ! $this->matches($permission, [
                    ModuleKey::Users->value,
                    ModuleKey::Roles->value,
                    ModuleKey::ActivityLogs->value,
                    ModuleKey::Locales->value,
                ]) && $this->hasAllowedAction($permission, [
                    PermissionAction::View->value,
                    PermissionAction::Create->value,
                    PermissionAction::Update->value,
                ])
            )),
        };
    }

    protected function matches(string $permission, array $modules): bool
    {
        return in_array(explode('.', $permission)[0], $modules, true);
    }

    protected function hasAllowedAction(string $permission, array $actions): bool
    {
        return in_array(explode('.', $permission)[1] ?? '', $actions, true);
    }
}
