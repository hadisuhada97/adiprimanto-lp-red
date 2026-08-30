<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\Technology;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PortfolioSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['next-nuxt', '#00DC82', 'Next/Nuxt', 'Next/Nuxt'],
            ['react', '#61DAFB', 'React', 'React'],
            ['vue', '#42B883', 'Vue', 'Vue'],
            ['php-laravel', '#F05340', 'PHP/Laravel', 'PHP/Laravel'],
            ['other', '#7A788A', 'Lainnya', 'Other'],
        ];

        foreach ($categories as $index => [$slug, $color, $nameId, $nameEn]) {
            $category = ProjectCategory::query()->updateOrCreate(
                ['slug' => $slug],
                ['color_hex' => $color, 'is_active' => true, 'sort_order' => $index + 1]
            );

            $category->syncTranslations([
                'id' => ['name' => $nameId],
                'en' => ['name' => $nameEn],
            ]);
        }

        $technologies = [
            ['Next.js', 'nextjs', 'SiNextdotjs', '#ffffff'],
            ['React', 'react', 'SiReact', '#61DAFB'],
            ['Vue.js', 'vuejs', 'SiVuedotjs', '#42B883'],
            ['Nuxt', 'nuxt', 'SiNuxt', '#00DC82'],
            ['TypeScript', 'typescript', 'SiTypescript', '#3178C6'],
            ['Tailwind CSS', 'tailwindcss', 'SiTailwindcss', '#06B6D4'],
            ['Laravel', 'laravel', 'SiLaravel', '#F05340'],
            ['PHP', 'php', 'SiPhp', '#777BB4'],
            ['MySQL', 'mysql', 'SiMysql', '#4479A1'],
            ['Node.js', 'nodejs', 'SiNodedotjs', '#339933'],
            ['Flutter', 'flutter', 'SiFlutter', '#54C5F8'],
            ['React Native', 'react-native', 'SiReact', '#61DAFB'],
        ];

        foreach ($technologies as $index => [$name, $slug, $icon, $color]) {
            Technology::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'icon_name' => $icon, 'color_hex' => $color, 'is_active' => true, 'sort_order' => $index + 1]
            );
        }

        $projects = [
            [
                'slug' => 'sentraoto-marketplace',
                'category' => 'next-nuxt',
                'client' => 'Sentraoto',
                'year' => 2025,
                'demo' => 'https://sentraoto.com',
                'technologies' => ['nextjs', 'typescript', 'tailwindcss'],
                'id' => ['Website Jual Beli Kendaraan', 'Marketplace kendaraan dengan pencarian cepat dan halaman detail yang rapi.'],
                'en' => ['Vehicle Marketplace Website', 'A vehicle marketplace with fast search and clean detail pages.'],
            ],
            [
                'slug' => 'dkn-digital-company-profile',
                'category' => 'php-laravel',
                'client' => 'DKN Digital',
                'year' => 2024,
                'demo' => 'https://dkndigital.com',
                'technologies' => ['laravel', 'php', 'mysql'],
                'id' => ['Website Company Profile', 'Company profile yang membangun kredibilitas sebelum klien menghubungi.'],
                'en' => ['Company Profile Website', 'A company profile that builds credibility before clients reach out.'],
            ],
            [
                'slug' => 'asih-photography-portfolio',
                'category' => 'react',
                'client' => 'Asih Angger',
                'year' => 2024,
                'demo' => null,
                'technologies' => ['react', 'tailwindcss'],
                'id' => ['Website Portfolio Jasa Fotografi', 'Galeri portofolio fotografi yang ringan dan fokus pada gambar.'],
                'en' => ['Photography Portfolio Website', 'A lightweight photography portfolio gallery focused on the images.'],
            ],
        ];

        foreach ($projects as $index => $data) {
            $project = Project::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'project_category_id' => ProjectCategory::query()->where('slug', $data['category'])->value('id'),
                    'client_name' => $data['client'],
                    'year' => $data['year'],
                    'demo_url' => $data['demo'],
                    'is_featured' => $index === 0,
                    'is_active' => true,
                    'status' => 'published',
                    'published_at' => now()->subDays(($index + 1) * 7),
                    'sort_order' => $index + 1,
                ]
            );

            $project->syncTranslations([
                'id' => ['title' => $data['id'][0], 'description' => $data['id'][1]],
                'en' => ['title' => $data['en'][0], 'description' => $data['en'][1]],
            ]);

            $project->technologies()->sync(
                Technology::query()->whereIn('slug', $data['technologies'])->pluck('id')->all()
            );
        }
    }
}
