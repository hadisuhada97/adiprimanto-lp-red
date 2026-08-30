<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ContactMessage;
use App\Models\Faq;
use App\Models\Media;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\Project;
use App\Models\Service;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseApiController
{
    public function stats(): JsonResponse
    {
        $days = collect(range(29, 0))->map(fn (int $offset) => now()->subDays($offset)->toDateString());

        $leadsPerDay = ContactMessage::query()
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('date(created_at) as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        return $this->respondSuccess([
            'counts' => [
                'projects_published' => Project::query()->where('status', 'published')->count(),
                'projects_draft' => Project::query()->where('status', 'draft')->count(),
                'testimonials' => Testimonial::query()->count(),
                'services' => Service::query()->count(),
                'faqs' => Faq::query()->count(),
                'clients' => Client::query()->count(),
                'media' => Media::query()->count(),
                'messages_total' => ContactMessage::query()->count(),
                'messages_unread' => ContactMessage::query()->whereNull('read_at')->count(),
            ],
            'leads_timeline' => $days->map(fn (string $day) => [
                'date' => $day,
                'total' => (int) ($leadsPerDay[$day] ?? 0),
            ])->values(),
            'recent_activity' => ActivityLogResource::collection(
                ActivityLog::query()->with('user')->latest('created_at')->limit(8)->get()
            ),
            'recent_messages' => ContactMessage::query()
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (ContactMessage $message) => [
                    'id' => $message->id,
                    'name' => $message->name,
                    'subject' => $message->subject,
                    'status' => $message->status,
                    'created_at' => $message->created_at?->toIso8601String(),
                ]),
            'translation_gaps' => $this->translationGaps(),
        ], 'Dashboard statistics retrieved successfully.');
    }

    /** Content that still has no English translation, per module. */
    protected function translationGaps(): array
    {
        $modules = [
            'Services' => Service::class,
            'Testimonials' => Testimonial::class,
            'FAQs' => Faq::class,
            'Pain points' => PainPoint::class,
            'Process steps' => ProcessStep::class,
        ];

        return collect($modules)
            ->map(fn (string $model, string $label) => [
                'module' => $label,
                'missing' => $model::query()
                    ->whereDoesntHave('translations', fn ($query) => $query->where('locale', 'en'))
                    ->count(),
            ])
            ->filter(fn (array $row) => $row['missing'] > 0)
            ->values()
            ->all();
    }
}
