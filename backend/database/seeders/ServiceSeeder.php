<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceStat;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'icon_name' => 'Rocket',
                'is_featured' => true,
                'id' => [
                    'title' => 'Landing Page',
                    'description' => 'Satu halaman yang mendorong satu aksi. Struktur terbukti untuk memaksimalkan leads dan penjualan — bukan sekadar cantik.',
                    'tags' => ['Konversi Tinggi', 'SEO-Ready'],
                ],
                'en' => [
                    'title' => 'Landing Page',
                    'description' => 'One page built around one action. A proven structure to maximise leads and sales, not just good looks.',
                    'tags' => ['High Converting', 'SEO-Ready'],
                ],
            ],
            [
                'icon_name' => 'Building2',
                'is_featured' => false,
                'id' => [
                    'title' => 'Company Profile',
                    'description' => 'Kesan pertama yang membangun kepercayaan sebelum klien menghubungi Anda. Rapi, profesional, dan selaras dengan brand.',
                    'tags' => ['Brand Identity', 'Kredibilitas'],
                ],
                'en' => [
                    'title' => 'Company Profile',
                    'description' => 'A first impression that builds trust before clients even reach out. Clean, professional and on brand.',
                    'tags' => ['Brand Identity', 'Credibility'],
                ],
            ],
            [
                'icon_name' => 'ShoppingCart',
                'is_featured' => false,
                'id' => [
                    'title' => 'E-Commerce / Online Shop',
                    'description' => 'Toko online yang cepat, mudah dikelola, dan nyaman untuk pelanggan — dengan sistem pembayaran yang siap pakai.',
                    'tags' => ['Payment Ready', 'Mudah Kelola'],
                ],
                'en' => [
                    'title' => 'E-Commerce / Online Shop',
                    'description' => 'A fast online store that is easy to manage and pleasant for customers, with payments ready to go.',
                    'tags' => ['Payment Ready', 'Easy To Manage'],
                ],
            ],
            [
                'icon_name' => 'LayoutDashboard',
                'is_featured' => false,
                'id' => [
                    'title' => 'Custom Web App',
                    'description' => 'Dashboard, SaaS, atau sistem internal — dibangun sesuai alur bisnis Anda.',
                    'tags' => ['Full Custom', 'Scalable'],
                ],
                'en' => [
                    'title' => 'Custom Web App',
                    'description' => 'Dashboards, SaaS or internal systems, built around the way your business actually works.',
                    'tags' => ['Full Custom', 'Scalable'],
                ],
            ],
            [
                'icon_name' => 'Bot',
                'is_featured' => false,
                'id' => [
                    'title' => 'AI & Automation',
                    'description' => 'Chatbot, otomatisasi alur kerja, atau integrasi AI — kurangi pekerjaan repetitif dan tingkatkan respons pelanggan.',
                    'tags' => ['Hemat Waktu', 'AI-Powered'],
                ],
                'en' => [
                    'title' => 'AI & Automation',
                    'description' => 'Chatbots, workflow automation or AI integrations to cut repetitive work and answer customers faster.',
                    'tags' => ['Time Saving', 'AI-Powered'],
                ],
            ],
            [
                'icon_name' => 'Smartphone',
                'is_featured' => false,
                'id' => [
                    'title' => 'Mobile Application',
                    'description' => 'Aplikasi mobile yang responsif — pengalaman pengguna yang mulus di Android maupun iOS.',
                    'tags' => ['Android & iOS', 'User-Friendly'],
                ],
                'en' => [
                    'title' => 'Mobile Application',
                    'description' => 'Responsive mobile apps with a smooth experience on both Android and iOS.',
                    'tags' => ['Android & iOS', 'User-Friendly'],
                ],
            ],
            [
                'icon_name' => 'Wrench',
                'is_featured' => false,
                'id' => [
                    'title' => 'Maintenance & Support',
                    'description' => 'Pembaruan rutin, perbaikan bug, dan dukungan teknis — memastikan website atau aplikasi Anda selalu optimal.',
                    'tags' => ['Pembaruan Rutin', 'Dukungan Teknis'],
                ],
                'en' => [
                    'title' => 'Maintenance & Support',
                    'description' => 'Routine updates, bug fixes and technical support so your website or app keeps performing.',
                    'tags' => ['Routine Updates', 'Technical Support'],
                ],
            ],
        ];

        foreach ($services as $index => $data) {
            $existing = Service::query()
                ->whereHas('translations', fn ($query) => $query->where('title', $data['en']['title']))
                ->first();

            $service = $existing ?? new Service();

            $service->fill([
                'icon_name' => $data['icon_name'],
                'is_featured' => $data['is_featured'],
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $service->syncTranslations([
                'id' => $data['id'],
                'en' => $data['en'],
            ]);
        }

        $stats = [
            [
                'value' => '7–14',
                'icon_name' => 'CalendarClock',
                'id' => ['unit' => 'hari kerja', 'label' => 'Estimasi pengerjaan landing page standar'],
                'en' => ['unit' => 'working days', 'label' => 'Typical delivery time for a standard landing page'],
            ],
            [
                'value' => '98+',
                'icon_name' => 'Gauge',
                'id' => ['unit' => 'page speed', 'label' => 'Skor performa rata-rata project yang selesai'],
                'en' => ['unit' => 'page speed', 'label' => 'Average performance score across delivered projects'],
            ],
            [
                'value' => '3',
                'icon_name' => 'LifeBuoy',
                'id' => ['unit' => 'bulan support gratis', 'label' => 'Bantuan teknis setelah website live'],
                'en' => ['unit' => 'months free support', 'label' => 'Technical assistance after the website goes live'],
            ],
        ];

        foreach ($stats as $index => $data) {
            $existing = ServiceStat::query()->where('value', $data['value'])->first();
            $stat = $existing ?? new ServiceStat();

            $stat->fill([
                'value' => $data['value'],
                'icon_name' => $data['icon_name'],
                'is_active' => true,
                'sort_order' => $index + 1,
            ])->save();

            $stat->syncTranslations([
                'id' => $data['id'],
                'en' => $data['en'],
            ]);
        }
    }
}
