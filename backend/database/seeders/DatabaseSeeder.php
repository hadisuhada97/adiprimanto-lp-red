<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LocaleSeeder::class,
            PermissionSeeder::class,
            RoleSeeder::class,
            AdminUserSeeder::class,
            SettingSeeder::class,
            PortfolioSeeder::class,
            HeroAboutSeeder::class,
            SiteContentSeeder::class,
            TestimonialSeeder::class,
            ServiceSeeder::class,
            FaqSeeder::class,
        ]);
    }
}
