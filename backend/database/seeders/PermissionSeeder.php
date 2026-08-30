<?php

namespace Database\Seeders;

use App\Enums\ModuleKey;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ModuleKey::cases() as $module) {
            foreach ($module->actions() as $action) {
                $slug = "{$module->value}.{$action->value}";

                Permission::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => "{$action->label()} {$module->label()}",
                        'module' => $module->value,
                        'action' => $action->value,
                    ]
                );
            }
        }
    }
}
