<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ContactChannel;
use App\Models\NavigationMenu;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\SeoSetting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\SocialLink;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedSkills();
        $this->seedPainPoints();
        $this->seedProcessSteps();
        $this->seedClients();
        $this->seedNavigation();
        $this->seedContact();
        $this->seedSeo();
    }

    protected function seedSkills(): void
    {
        $categories = [
            ['01', 'Frontend Core', 'Frontend Core', [
                ['HTML5', 'SiHtml5', '#E34F26'],
                ['CSS3', 'SiCss', '#1572B6'],
                ['JavaScript', 'SiJavascript', '#F7DF1E'],
                ['TypeScript', 'SiTypescript', '#3178C6'],
                ['jQuery', 'SiJquery', '#0769AD'],
                ['Bootstrap', 'SiBootstrap', '#7952B3'],
                ['Tailwind', 'SiTailwindcss', '#06B6D4'],
                ['WordPress', 'SiWordpress', '#21759B'],
            ]],
            ['02', 'Frameworks', 'Frameworks', [
                ['React JS', 'SiReact', '#61DAFB'],
                ['Next JS', 'SiNextdotjs', '#FFFFFF'],
                ['Vue JS', 'SiVuedotjs', '#42B883'],
                ['Nuxt JS', 'SiNuxt', '#00DC82'],
                ['Pinia', 'SiVuedotjs', '#42B883'],
                ['Vuex', 'SiVuedotjs', '#42B883'],
            ]],
            ['03', 'Mobile Development', 'Mobile Development', [
                ['React Native', 'SiReact', '#61DAFB'],
                ['Flutter', 'SiFlutter', '#54C5F8'],
            ]],
            ['04', 'Backend & Tools', 'Backend & Tools', [
                ['Node JS', 'SiNodedotjs', '#339933'],
                ['PHP', 'SiPhp', '#777BB4'],
                ['Laravel', 'SiLaravel', '#FF2D20'],
                ['MySQL', 'SiMysql', '#4479A1'],
                ['Python', 'SiPython', '#3776AB'],
                ['Git', 'SiGit', '#F05032'],
            ]],
        ];

        foreach ($categories as $index => [$eyebrow, $nameId, $nameEn, $skills]) {
            $category = SkillCategory::query()
                ->whereHas('translations', fn ($query) => $query->where('name', $nameEn))
                ->first() ?? new SkillCategory();

            $category->fill([
                'eyebrow' => $eyebrow,
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $category->syncTranslations([
                'id' => ['name' => $nameId],
                'en' => ['name' => $nameEn],
            ]);

            foreach ($skills as $position => [$name, $icon, $color]) {
                Skill::query()->updateOrCreate(
                    ['name' => $name, 'skill_category_id' => $category->id],
                    [
                        'icon_name' => $icon,
                        'color_hex' => $color,
                        'is_active' => true,
                        'sort_order' => $position + 1,
                    ]
                );
            }
        }
    }

    protected function seedPainPoints(): void
    {
        $points = [
            [
                'Gauge',
                ['Lambat & Tidak Optimal', 'Lebih dari 70% pengunjung meninggalkan website yang membutuhkan waktu loading lebih dari 3 detik.'],
                ['Slow & Unoptimised', 'More than 70% of visitors leave a website that takes longer than 3 seconds to load.'],
            ],
            [
                'Palette',
                ['Tampilan Tidak Meyakinkan', 'Desain yang kurang rapi membuat brand terlihat tidak profesional dan menurunkan kepercayaan calon pelanggan.'],
                ['Unconvincing Design', 'An untidy design makes a brand look unprofessional and lowers the trust of potential customers.'],
            ],
            [
                'Smartphone',
                ['Tidak Mobile-Friendly', 'Mayoritas pengguna mengakses website lewat smartphone. Tanpa tampilan mobile yang baik, potensi pasar ikut hilang.'],
                ['Not Mobile-Friendly', 'Most users browse on a smartphone. Without a solid mobile layout you lose a large part of the market.'],
            ],
        ];

        foreach ($points as $index => [$icon, $idText, $enText]) {
            $point = PainPoint::query()
                ->whereHas('translations', fn ($query) => $query->where('title', $idText[0]))
                ->first() ?? new PainPoint();

            $point->fill(['icon_name' => $icon, 'is_active' => true, 'sort_order' => $index + 1])->save();

            $point->syncTranslations([
                'id' => ['title' => $idText[0], 'description' => $idText[1]],
                'en' => ['title' => $enText[0], 'description' => $enText[1]],
            ]);
        }
    }

    protected function seedProcessSteps(): void
    {
        $steps = [
            [
                'MessagesSquare',
                ['Brief & Analisis', 'Diskusi awal untuk memahami tujuan bisnis, target audiens, dan kebutuhan website agar solusi yang dibuat benar-benar relevan.'],
                ['Brief & Analysis', 'An initial discussion to understand your business goals, audience and website needs so the solution is genuinely relevant.'],
            ],
            [
                'PenTool',
                ['Desain & Perencanaan', 'Menyusun struktur halaman, alur pengguna, dan desain visual yang modern, mudah digunakan, serta selaras dengan brand Anda.'],
                ['Design & Planning', 'Mapping the page structure, user flow and a modern, easy-to-use visual design that matches your brand.'],
            ],
            [
                'Code2',
                ['Pengembangan Website', 'Proses pengembangan website dengan standar performa tinggi, SEO-friendly, responsif, dan aman di semua perangkat.'],
                ['Website Development', 'Development with high performance standards: SEO-friendly, responsive and secure on every device.'],
            ],
            [
                'Rocket',
                ['Launch & Support', 'Website diuji, diluncurkan, dan siap digunakan. Saya juga menyediakan dukungan teknis serta panduan penggunaan setelah website online.'],
                ['Launch & Support', 'The website is tested, launched and ready to use, with technical support and a usage guide after going live.'],
            ],
        ];

        foreach ($steps as $index => [$icon, $idText, $enText]) {
            $step = ProcessStep::query()
                ->whereHas('translations', fn ($query) => $query->where('title', $idText[0]))
                ->first() ?? new ProcessStep();

            $step->fill([
                'icon_name' => $icon,
                'step_number' => $index + 1,
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $step->syncTranslations([
                'id' => ['title' => $idText[0], 'description' => $idText[1]],
                'en' => ['title' => $enText[0], 'description' => $enText[1]],
            ]);
        }
    }

    protected function seedClients(): void
    {
        $clients = [
            ['TripLinq', 'MapPinned', 'font-display font-semibold tracking-widest uppercase'],
            ['Tea Sense', 'Coffee', 'font-display italic font-medium tracking-tight'],
            ['Quik Shine', 'Zap', 'font-display font-black italic uppercase tracking-tight'],
            ['HoodVerse', 'Ghost', 'font-display font-extrabold tracking-tight'],
            ['Nakalang Electronics', 'Activity', 'font-display font-bold tracking-tight'],
        ];

        foreach ($clients as $index => [$name, $icon, $fontClass]) {
            Client::query()->updateOrCreate(
                ['name' => $name],
                [
                    'icon_name' => $icon,
                    'font_class' => $fontClass,
                    'is_featured' => $index === 0,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }

    protected function seedNavigation(): void
    {
        $header = [
            ['#home', 'Home', 'Home'],
            ['#about', 'About', 'About'],
            ['#services', 'Layanan', 'Services'],
            ['#portfolio', 'Portfolio', 'Portfolio'],
            ['#testimoni', 'Testimoni', 'Testimonials'],
            ['#faq', 'FAQ', 'FAQ'],
        ];

        $footer = [
            ['#about', 'About', 'About'],
            ['#services', 'Layanan', 'Services'],
            ['#portfolio', 'Portfolio', 'Portfolio'],
            ['#process', 'Proses', 'Process'],
            ['#faq', 'FAQ', 'FAQ'],
        ];

        foreach ([['header', $header], ['footer', $footer]] as [$location, $items]) {
            foreach ($items as $index => [$anchor, $labelId, $labelEn]) {
                $item = NavigationMenu::query()
                    ->where('location', $location)
                    ->where('anchor', $anchor)
                    ->first() ?? new NavigationMenu();

                $item->fill([
                    'location' => $location,
                    'anchor' => $anchor,
                    'target' => '_self',
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ])->save();

                $item->syncTranslations([
                    'id' => ['label' => $labelId],
                    'en' => ['label' => $labelEn],
                ]);
            }
        }
    }

    protected function seedContact(): void
    {
        $channels = [
            ['whatsapp', '+62 857-2734-6620', 'https://wa.me/6285727346620', 'MessageCircle', '#25D366', 'WhatsApp'],
            ['email', 'adiprimanto.98@gmail.com', 'mailto:adiprimanto.98@gmail.com', 'Mail', '#EF4444', 'Email'],
            ['instagram', '@adiprimanto', 'https://www.instagram.com/adiprimanto/', 'Instagram', '#E1306C', 'Instagram'],
        ];

        foreach ($channels as $index => [$type, $value, $url, $icon, $color, $label]) {
            $channel = ContactChannel::query()->where('type', $type)->first() ?? new ContactChannel();

            $channel->fill([
                'type' => $type,
                'value' => $value,
                'url' => $url,
                'icon_name' => $icon,
                'color_hex' => $color,
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $channel->syncTranslations([
                'id' => ['label' => $label],
                'en' => ['label' => $label],
            ]);
        }

        $links = [
            ['LinkedIn', 'https://www.linkedin.com/in/adi-primanto/', 'Linkedin', '#0A66C2'],
            ['Instagram', 'https://www.instagram.com/adiprimanto', 'Instagram', '#E1306C'],
            ['TikTok', 'https://www.tiktok.com/@adi_primanto?lang=id-ID', 'Music2', '#000000'],
            ['GitHub', 'https://github.com/adiprimanto', 'Github', '#181717'],
        ];

        foreach ($links as $index => [$platform, $url, $icon, $color]) {
            SocialLink::query()->updateOrCreate(
                ['platform' => $platform],
                [
                    'url' => $url,
                    'icon_name' => $icon,
                    'color_hex' => $color,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }

    protected function seedSeo(): void
    {
        $pages = [
            [
                'home',
                [
                    'Adi Primanto — Jasa Pembuatan Website & Mobile App',
                    'Software Engineer di Yogyakarta yang membantu bisnis lokal dan startup tampil profesional lewat website cepat, SEO-ready, dan mobile-friendly.',
                    'jasa website, web developer yogyakarta, landing page, company profile',
                ],
                [
                    'Adi Primanto — Website & Mobile App Development',
                    'A Yogyakarta based Software Engineer helping local businesses and startups look professional with fast, SEO-ready and mobile-friendly websites.',
                    'website service, web developer yogyakarta, landing page, company profile',
                ],
            ],
            [
                'portfolio',
                [
                    'Portfolio — Adi Primanto',
                    'Kumpulan project website, aplikasi mobile, dan sistem custom yang telah dikerjakan untuk klien dari berbagai industri.',
                    'portfolio web developer, project website, studi kasus',
                ],
                [
                    'Portfolio — Adi Primanto',
                    'A collection of websites, mobile apps and custom systems delivered for clients across different industries.',
                    'web developer portfolio, website projects, case studies',
                ],
            ],
        ];

        foreach ($pages as $index => [$pageKey, $idMeta, $enMeta]) {
            $entry = SeoSetting::query()->updateOrCreate(
                ['page_key' => $pageKey],
                [
                    'robots_directive' => 'index,follow',
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );

            $entry->syncTranslations([
                'id' => [
                    'meta_title' => $idMeta[0],
                    'meta_description' => $idMeta[1],
                    'meta_keywords' => $idMeta[2],
                ],
                'en' => [
                    'meta_title' => $enMeta[0],
                    'meta_description' => $enMeta[1],
                    'meta_keywords' => $enMeta[2],
                ],
            ]);
        }

        $home = SeoSetting::query()->where('page_key', 'home')->first();

        if ($home && blank($home->structured_data)) {
            $home->forceFill(['structured_data' => $this->homeStructuredData()])->save();
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function homeStructuredData(): array
    {
        $baseUrl = 'https://adiprimanto.com';

        return [
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Person',
                    '@id' => $baseUrl.'/#person',
                    'name' => 'Adi Primanto',
                    'url' => $baseUrl,
                    'image' => $baseUrl.'/adi.webp',
                    'jobTitle' => 'Software Engineer & Web Developer',
                    'description' => 'Software Engineer dengan 5+ tahun pengalaman membangun website dan aplikasi mobile profesional untuk bisnis di Indonesia.',
                    'address' => [
                        '@type' => 'PostalAddress',
                        'addressLocality' => 'Yogyakarta',
                        'addressCountry' => 'ID',
                    ],
                    'sameAs' => [
                        'https://github.com/adiprimanto',
                        'https://www.linkedin.com/in/adi-primanto/',
                        'https://www.instagram.com/adiprimanto',
                    ],
                ],
                [
                    '@type' => 'LocalBusiness',
                    '@id' => $baseUrl.'/#business',
                    'name' => 'Adi Primanto — Jasa Website & Aplikasi',
                    'url' => $baseUrl,
                    'image' => $baseUrl.'/adi.webp',
                    'description' => 'Jasa pembuatan website profesional dan aplikasi mobile untuk bisnis dan UMKM di Indonesia.',
                    'telephone' => '+6285727346620',
                    'address' => [
                        '@type' => 'PostalAddress',
                        'addressLocality' => 'Yogyakarta',
                        'addressRegion' => 'DI Yogyakarta',
                        'addressCountry' => 'ID',
                    ],
                    'geo' => [
                        '@type' => 'GeoCoordinates',
                        'latitude' => -7.7956,
                        'longitude' => 110.3695,
                    ],
                    'areaServed' => ['@type' => 'Country', 'name' => 'Indonesia'],
                    'priceRange' => '$$',
                    'openingHours' => 'Mo-Fr 09:00-17:00',
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => $baseUrl.'/#website',
                    'url' => $baseUrl,
                    'name' => 'Adi Primanto',
                    'description' => 'Portfolio & Jasa Web Development',
                    'publisher' => ['@id' => $baseUrl.'/#person'],
                    'inLanguage' => 'id-ID',
                ],
            ],
        ];
    }
}
