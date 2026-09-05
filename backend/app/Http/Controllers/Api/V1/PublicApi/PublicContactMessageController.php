<?php

namespace App\Http\Controllers\Api\V1\PublicApi;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\ContactMessageRequest;
use App\Models\ContactMessage;
use App\Models\Setting;
use App\Notifications\NewContactMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Notification;

class PublicContactMessageController extends BaseApiController
{
    public function store(ContactMessageRequest $request): JsonResponse
    {
        $enabled = Setting::query()
            ->where('group', 'integration')
            ->where('key', 'is_contact_form_enabled')
            ->value('value');

        if ($enabled === false || $enabled === '0' || $enabled === 0) {
            return $this->respondError(
                $request->formLocale() === 'id'
                    ? 'Form kontak sedang tidak aktif.'
                    : 'The contact form is currently disabled.',
                503
            );
        }

        $message = ContactMessage::query()->create([
            ...$request->safe()->except(['website']),
            'status' => 'new',
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'referrer' => substr((string) $request->headers->get('referer'), 0, 512) ?: null,
        ]);

        $recipient = Setting::query()
            ->where('group', 'integration')
            ->where('key', 'contact_notification_email')
            ->value('value')
            ?: Setting::query()->where('group', 'general')->where('key', 'contact_email')->value('value');

        if (is_string($recipient) && $recipient !== '') {
            Notification::route('mail', $recipient)
                ->notify((new NewContactMessageNotification($message))->afterCommit());
        }

        return $this->respondCreated(
            ['id' => $message->id],
            $request->formLocale() === 'id'
                ? 'Terima kasih! Pesan Anda sudah terkirim.'
                : 'Thank you! Your message has been sent.'
        );
    }
}
