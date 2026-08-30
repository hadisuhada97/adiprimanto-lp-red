<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Models\FaqCategory;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['general', ['id' => 'Umum', 'en' => 'General']],
            ['pricing', ['id' => 'Harga & Pembayaran', 'en' => 'Pricing & Payment']],
            ['technical', ['id' => 'Teknis', 'en' => 'Technical']],
        ];

        foreach ($categories as $index => [$slug, $names]) {
            $category = FaqCategory::query()->updateOrCreate(
                ['slug' => $slug],
                ['is_active' => true, 'sort_order' => $index + 1]
            );

            $category->syncTranslations([
                'id' => ['name' => $names['id']],
                'en' => ['name' => $names['en']],
            ]);
        }

        $faqs = [
            [
                'category' => 'general',
                'id' => [
                    'question' => 'Berapa lama proses pembuatan website?',
                    'answer' => 'Durasi pengerjaan menyesuaikan dengan tingkat kompleksitas website. Untuk landing page standar, proses pengerjaan umumnya memakan waktu 7–14 hari kerja sejak kebutuhan disepakati.',
                ],
                'en' => [
                    'question' => 'How long does it take to build a website?',
                    'answer' => 'Timelines depend on complexity. A standard landing page usually takes 7–14 working days once the requirements are agreed.',
                ],
            ],
            [
                'category' => 'technical',
                'id' => [
                    'question' => 'Apakah saya bisa mengedit konten website sendiri nantinya?',
                    'answer' => 'Fleksibilitas pengelolaan konten selalu disesuaikan dengan kebutuhan Anda. Anda bisa memilih website dengan CMS untuk kontrol penuh, atau website statis yang lebih ringan dengan dukungan perubahan konten dari saya kapan pun dibutuhkan.',
                ],
                'en' => [
                    'question' => 'Will I be able to edit the content myself?',
                    'answer' => 'Yes. You can choose a CMS-backed website for full control, or a lighter static website where I handle content changes whenever you need them.',
                ],
            ],
            [
                'category' => 'technical',
                'id' => [
                    'question' => 'Apakah website-nya sudah termasuk SEO?',
                    'answer' => 'Ya. Setiap website dibangun dengan struktur SEO-ready, meliputi penggunaan heading yang tepat, meta tag teroptimasi, serta praktik teknis yang sesuai dengan standar terbaru Google.',
                ],
                'en' => [
                    'question' => 'Is SEO included?',
                    'answer' => 'Yes. Every website is built SEO-ready: proper heading structure, optimised meta tags and technical practices aligned with the latest Google guidance.',
                ],
            ],
            [
                'category' => 'pricing',
                'id' => [
                    'question' => 'Apakah ada biaya maintenance tahunan?',
                    'answer' => 'Tidak ada biaya maintenance bulanan atau tahunan. Anda hanya perlu memperpanjang domain dan hosting setiap tahun. Selain itu, saya juga menyediakan bantuan teknis minor gratis selama 3 bulan pertama setelah website online.',
                ],
                'en' => [
                    'question' => 'Are there annual maintenance fees?',
                    'answer' => 'There are no monthly or annual maintenance fees. You only renew your domain and hosting each year, and minor technical help is free for the first 3 months after launch.',
                ],
            ],
        ];

        foreach ($faqs as $index => $data) {
            $existing = Faq::query()
                ->whereHas('translations', fn ($query) => $query->where('question', $data['id']['question']))
                ->first();

            $faq = $existing ?? new Faq();

            $faq->fill([
                'faq_category_id' => FaqCategory::query()->where('slug', $data['category'])->value('id'),
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $faq->syncTranslations([
                'id' => $data['id'],
                'en' => $data['en'],
            ]);
        }
    }
}
