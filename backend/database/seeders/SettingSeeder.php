<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // group, key, value, type
            ['general', 'brand_name', 'Adi Primanto', 'string'],
            ['general', 'brand_tagline', 'Web & App Developer · Yogyakarta', 'string'],
            ['general', 'whatsapp_number', '6285727346620', 'string'],
            ['general', 'contact_email', 'adiprimanto.98@gmail.com', 'string'],
            ['general', 'location', 'Yogyakarta, Indonesia', 'string'],
            ['general', 'opening_hours', 'Mo-Fr 09:00-17:00', 'string'],
            ['general', 'default_locale', 'id', 'string'],
            ['general', 'default_theme', 'dark', 'string'],
            ['general', 'cv_file_path', '/CV_New_ADI_PRIMANTO.pdf', 'string'],
            ['general', 'base_url', 'https://adiprimanto.com', 'string'],
            ['general', 'logo_media_id', null, 'media'],
            ['general', 'favicon_media_id', null, 'media'],
            ['appearance', 'primary_color', '#ef4444', 'string'],
            ['appearance', 'is_language_switcher_enabled', true, 'boolean'],
            ['appearance', 'is_theme_switcher_enabled', true, 'boolean'],
            ['integration', 'is_contact_form_enabled', true, 'boolean'],
            ['integration', 'contact_notification_email', 'adiprimanto.98@gmail.com', 'string'],
        ];

        foreach ($settings as [$group, $key, $value, $type]) {
            Setting::query()->updateOrCreate(
                ['group' => $group, 'key' => $key],
                ['value' => $value, 'type' => $type, 'is_public' => $group !== 'integration']
            );
        }
    }
}
