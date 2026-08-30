<?php

namespace Database\Seeders;

use App\Models\Locale;
use Illuminate\Database\Seeder;

class LocaleSeeder extends Seeder
{
    public function run(): void
    {
        $locales = [
            ['code' => 'id', 'name' => 'Indonesian', 'native_name' => 'Bahasa Indonesia', 'is_default' => true, 'sort_order' => 1],
            ['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_default' => false, 'sort_order' => 2],
        ];

        foreach ($locales as $locale) {
            Locale::query()->updateOrCreate(
                ['code' => $locale['code']],
                $locale + ['is_active' => true]
            );
        }
    }
}
