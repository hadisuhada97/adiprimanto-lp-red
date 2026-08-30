<?php

namespace Database\Seeders;

use App\Models\AboutSection;
use App\Models\AboutStat;
use App\Models\HeroMetric;
use App\Models\HeroSection;
use Illuminate\Database\Seeder;

class HeroAboutSeeder extends Seeder
{
    public function run(): void
    {
        $hero = HeroSection::singleton();
        $hero->fill([
            'badge_icon' => 'Sparkles',
            'primary_cta_url' => '/CV_New_ADI_PRIMANTO.pdf',
            'secondary_cta_url' => 'https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.',
            'is_active' => true,
        ])->save();

        $hero->syncTranslations([
            'id' => [
                'badge' => 'Jasa Website & Mobile App',
                'role' => 'Premium App Development',
                'headline_line_1' => 'Membangun Website',
                'headline_highlight' => 'Berkualitas untuk Bisnis',
                'headline_stroke' => 'Anda',
                'description_prefix' => 'Bantu bisnis tampil lebih',
                'description_strong' => 'profesional dan dipercaya',
                'description_suffix' => 'sejak kesan pertama.',
                'primary_cta_label' => 'Download CV',
                'secondary_cta_label' => 'Konsultasi Gratis',
                'trusted_prefix' => 'Dipercaya',
                'trusted_strong' => '30+ bisnis lokal & startup',
                'trusted_suffix' => 'di Indonesia',
            ],
            'en' => [
                'badge' => 'Website & Mobile App Services',
                'role' => 'Premium App Development',
                'headline_line_1' => 'Building Quality',
                'headline_highlight' => 'Websites for Your',
                'headline_stroke' => 'Business',
                'description_prefix' => 'Helping businesses look more',
                'description_strong' => 'professional and trustworthy',
                'description_suffix' => 'from the very first impression.',
                'primary_cta_label' => 'Download CV',
                'secondary_cta_label' => 'Free Consultation',
                'trusted_prefix' => 'Trusted by',
                'trusted_strong' => '30+ local businesses & startups',
                'trusted_suffix' => 'in Indonesia',
            ],
        ]);

        $metrics = [
            ['98+', 'Zap', '#eab308', 'Page Speed', 'Page Speed'],
            ['↑ 32%', 'TrendingUp', '#22c55e', 'Conversion', 'Conversion'],
            ['A', 'Search', '#ef4444', 'SEO Score', 'SEO Score'],
        ];

        foreach ($metrics as $index => [$value, $icon, $color, $labelId, $labelEn]) {
            $metric = HeroMetric::query()->where('value', $value)->first() ?? new HeroMetric();

            $metric->fill([
                'value' => $value,
                'icon_name' => $icon,
                'color_hex' => $color,
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $metric->syncTranslations([
                'id' => ['label' => $labelId],
                'en' => ['label' => $labelEn],
            ]);
        }

        $about = AboutSection::singleton();
        $about->fill([
            'location_lat' => -7.7955798,
            'location_lng' => 110.3694896,
            'primary_cta_url' => '#contact',
            'secondary_cta_url' => '#portfolio',
            'is_active' => true,
        ])->save();

        $about->syncTranslations([
            'id' => [
                'eyebrow' => 'TENTANG SAYA',
                'location' => 'Yogyakarta, Indonesia',
                'headline' => 'Orang di Balik',
                'headline_highlight' => 'Layar.',
                'bio_paragraph_1' => 'Seorang Software Engineer dengan pengalaman lebih dari 5 tahun membangun website dan aplikasi yang tidak hanya cantik, tapi juga fungsional dan memenuhi kebutuhan pengguna.',
                'bio_paragraph_2' => 'Saat ini bekerja di salah satu startup di Yogyakarta, saya terbiasa menghadapi tantangan membangun produk digital dari nol hingga digunakan ribuan pengguna.',
                'bio_paragraph_3' => 'Di luar jam kerja, saya menyalurkan passion untuk membantu UMKM dan bisnis lokal hadir secara profesional di dunia digital melalui website yang didesain khusus untuk kebutuhan mereka.',
                'primary_cta_label' => 'Hubungi Saya',
                'secondary_cta_label' => 'Lihat Portfolio',
            ],
            'en' => [
                'eyebrow' => 'ABOUT ME',
                'location' => 'Yogyakarta, Indonesia',
                'headline' => 'The Person',
                'headline_highlight' => 'Behind the Screen.',
                'bio_paragraph_1' => 'A Software Engineer with more than 5 years of experience building websites and applications that are not only beautiful, but also functional and user-focused.',
                'bio_paragraph_2' => "Currently working at a startup in Yogyakarta, I'm used to the challenge of building digital products from scratch to being used by thousands of users.",
                'bio_paragraph_3' => 'Outside of work hours, I channel my passion into helping local SMEs and businesses show up professionally online through websites designed specifically for their needs.',
                'primary_cta_label' => 'Contact Me',
                'secondary_cta_label' => 'View Portfolio',
            ],
        ]);

        $stats = [
            ['5+', 'CalendarDays', ['Tahun Pengalaman', 'since 2020'], ['Years of Experience', 'since 2020']],
            ['30+', 'FolderCheck', ['Proyek Selesai', 'berbagai industri'], ['Projects Completed', 'various industries']],
            ['100%', 'Timer', ['Project Selesai Tepat Waktu', 'komitmen terhadap deadline'], ['On-Time Delivery', 'committed to deadlines']],
        ];

        foreach ($stats as $index => [$value, $icon, $idText, $enText]) {
            $stat = AboutStat::query()->where('value', $value)->first() ?? new AboutStat();

            $stat->fill([
                'value' => $value,
                'icon_name' => $icon,
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $stat->syncTranslations([
                'id' => ['label' => $idText[0], 'sublabel' => $idText[1]],
                'en' => ['label' => $enText[0], 'sublabel' => $enText[1]],
            ]);
        }
    }
}
