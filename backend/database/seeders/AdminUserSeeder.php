<?php

namespace Database\Seeders;

use App\Enums\RoleSlug;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL');
        $password = (string) env('ADMIN_PASSWORD');

        if ($email === '' || $password === '') {
            $this->command->warn('ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping admin seeding.');

            return;
        }

        $user = User::withTrashed()->firstOrNew(['email' => $email]);

        $user->fill([
            'name' => (string) env('ADMIN_NAME', 'Administrator'),
            'is_active' => true,
            'is_two_factor_enabled' => true,
        ]);

        // Idempotent: keep the password in sync with the environment file.
        if ($user->password === null || ! Hash::check($password, $user->password)) {
            $user->password = $password;
        }

        $user->deleted_at = null;
        $user->email_verified_at ??= now();
        $user->save();

        $superAdminId = Role::query()->where('slug', RoleSlug::SuperAdmin->value)->value('id');

        if ($superAdminId !== null) {
            $user->roles()->syncWithoutDetaching([$superAdminId]);
        }
    }
}
