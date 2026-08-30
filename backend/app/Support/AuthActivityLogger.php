<?php

namespace App\Support;

use App\Enums\AuthEvent;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Audit trail for authentication events, which are not tied to a model mutation.
 */
class AuthActivityLogger
{
    public static function record(AuthEvent $event, Request $request, ?User $user = null, array $context = []): void
    {
        ActivityLog::query()->create([
            'user_id' => $user?->id,
            'action' => $event->value,
            'subject_type' => $user !== null ? User::class : null,
            'subject_id' => $user?->id,
            'old_values' => [],
            'new_values' => $context,
            'description' => str_replace('_', ' ', str_replace('auth.', '', $event->value)),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
        ]);
    }

    public static function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        $visible = mb_substr($name, 0, 2);
        $masked = str_repeat('*', max(1, mb_strlen($name) - 2));

        return $domain === '' ? $visible.$masked : "{$visible}{$masked}@{$domain}";
    }
}
