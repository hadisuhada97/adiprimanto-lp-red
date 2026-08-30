<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'rating' => 5,
                'accent_color' => '#ef4444',
                'is_featured' => true,
                'id' => [
                    'name' => 'Asih Angger',
                    'role' => 'Photographer',
                    'company' => null,
                    'project_label' => 'Website Portfolio Jasa Fotografi',
                    'feedback' => 'Makasih banyak yaa mas adi udah bantu buatin website nya rapi dan sesuai request.. Udah sabar banget juga.. makin berkah dan sukses yaa mas adi.',
                ],
                'en' => [
                    'name' => 'Asih Angger',
                    'role' => 'Photographer',
                    'company' => null,
                    'project_label' => 'Photography Portfolio Website',
                    'feedback' => 'Thank you so much for building my website — clean and exactly as requested. Very patient throughout the process too.',
                ],
            ],
            [
                'rating' => 5,
                'accent_color' => '#f97316',
                'is_featured' => false,
                'id' => [
                    'name' => 'Dr. Ade Salman Alfarisi',
                    'role' => 'Co-Founder & Principal Consultant',
                    'company' => 'DKN Digital',
                    'project_label' => 'Website Company Profile',
                    'feedback' => 'Kami sangat mengapresiasi kerja sama dengan mas Adi Primanto dan team. Respons baik, komunikasi jelas, serta kemampuan teknis yang memadai dalam memahami kebutuhan kami. Website selesai dengan rapi dan sesuai arahan, termasuk revisi yang ditangani secara profesional.',
                ],
                'en' => [
                    'name' => 'Dr. Ade Salman Alfarisi',
                    'role' => 'Co-Founder & Principal Consultant',
                    'company' => 'DKN Digital',
                    'project_label' => 'Company Profile Website',
                    'feedback' => 'We really appreciated working with Adi Primanto and his team. Responsive, clear communication and technically capable of understanding our needs. The website was delivered cleanly and on brief, revisions included.',
                ],
            ],
            [
                'rating' => 5,
                'accent_color' => '#3ecfb2',
                'is_featured' => false,
                'id' => [
                    'name' => 'Rezky Perdana Ramadhansyah',
                    'role' => 'CEO & Founder',
                    'company' => 'Sentraoto',
                    'project_label' => 'Website Jual Beli Kendaraan',
                    'feedback' => 'Website nya oke, responsif. Request revisian nya juga ga pelit. Pengerjaan lumayan cepat, beberapa hal yang harusnya add cost tapi ini free.',
                ],
                'en' => [
                    'name' => 'Rezky Perdana Ramadhansyah',
                    'role' => 'CEO & Founder',
                    'company' => 'Sentraoto',
                    'project_label' => 'Vehicle Marketplace Website',
                    'feedback' => 'The website is great and responsive. Generous with revision requests, delivery was quick, and a few things that should have cost extra were included for free.',
                ],
            ],
        ];

        foreach ($testimonials as $index => $data) {
            $existing = Testimonial::query()
                ->whereHas('translations', fn ($query) => $query->where('name', $data['id']['name']))
                ->first();

            $testimonial = $existing ?? new Testimonial();

            $testimonial->fill([
                'rating' => $data['rating'],
                'accent_color' => $data['accent_color'],
                'is_featured' => $data['is_featured'],
                'source' => 'manual',
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $testimonial->syncTranslations([
                'id' => $data['id'],
                'en' => $data['en'],
            ]);
        }
    }
}
