<?php

namespace App\Services;

use App\Enums\AuthEvent;
use App\Exceptions\AuthenticationFailedException;
use App\Models\TwoFactorCode;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use App\Support\AuthActivityLogger;
use Illuminate\Http\Request;

class TwoFactorService
{
    /** Issue a fresh challenge and email the code to the user. */
    public function issueChallenge(User $user, Request $request): array
    {
        [$record, $code] = TwoFactorCode::issueFor($user, $request->ip());

        $user->notify(new TwoFactorCodeNotification($code, $request->ip()));

        AuthActivityLogger::record(AuthEvent::TwoFactorIssued, $request, $user, [
            'challenge_id' => $record->id,
            'channel' => $record->channel,
        ]);

        return $this->challengePayload($record, $user);
    }

    /** Resend the code for an existing challenge, respecting cooldown and resend limits. */
    public function resendChallenge(string $challengeToken, Request $request): array
    {
        $record = $this->findPendingChallenge($challengeToken);
        $user = $record->user;

        if ($record->hasExceededResendLimit()) {
            throw new AuthenticationFailedException(
                'You have reached the maximum number of resend requests. Please sign in again.',
                429
            );
        }

        $cooldown = $record->secondsUntilResendAllowed();

        if ($cooldown > 0) {
            throw new AuthenticationFailedException(
                "Please wait {$cooldown} seconds before requesting a new code.",
                429,
                ['retry_after_seconds' => $cooldown]
            );
        }

        $code = $record->rotateCode();

        $user->notify(new TwoFactorCodeNotification($code, $request->ip()));

        AuthActivityLogger::record(AuthEvent::TwoFactorResent, $request, $user, [
            'challenge_id' => $record->id,
            'resend_count' => $record->resend_count,
        ]);

        return $this->challengePayload($record->refresh(), $user);
    }

    /** Verify a submitted code and return the authenticated user. */
    public function verifyChallenge(string $challengeToken, string $code, Request $request): User
    {
        $record = $this->findPendingChallenge($challengeToken);
        $user = $record->user;

        if ($record->hasExceededAttempts()) {
            $record->delete();

            AuthActivityLogger::record(AuthEvent::TwoFactorFailed, $request, $user, [
                'reason' => 'attempts_exceeded',
            ]);

            throw new AuthenticationFailedException(
                'Too many invalid codes. Please sign in again to request a new one.',
                429
            );
        }

        if (! $record->matches($code)) {
            $record->registerFailedAttempt();

            AuthActivityLogger::record(AuthEvent::TwoFactorFailed, $request, $user, [
                'reason' => 'invalid_code',
                'attempts' => $record->attempts,
            ]);

            throw new AuthenticationFailedException(
                'The verification code is invalid.',
                422,
                ['remaining_attempts' => $record->remainingAttempts()]
            );
        }

        $record->markConsumed();

        AuthActivityLogger::record(AuthEvent::TwoFactorVerified, $request, $user, [
            'challenge_id' => $record->id,
        ]);

        return $user;
    }

    protected function findPendingChallenge(string $challengeToken): TwoFactorCode
    {
        $record = TwoFactorCode::with('user')->where('challenge_token', $challengeToken)->first();

        if ($record === null || $record->user === null) {
            throw new AuthenticationFailedException('This verification session is no longer valid.', 422);
        }

        if ($record->isConsumed()) {
            throw new AuthenticationFailedException('This verification code has already been used.', 422);
        }

        if ($record->isExpired()) {
            throw new AuthenticationFailedException('This verification code has expired. Please request a new one.', 422);
        }

        return $record;
    }

    protected function challengePayload(TwoFactorCode $record, User $user): array
    {
        return [
            'challenge_token' => $record->challenge_token,
            'channel' => $record->channel,
            'masked_email' => AuthActivityLogger::maskEmail($user->email),
            'code_length' => (int) config('two_factor.code_length'),
            'expires_at' => $record->expires_at->toIso8601String(),
            'expires_in_seconds' => (int) max(0, now()->diffInSeconds($record->expires_at, false)),
            'resend_available_in_seconds' => $record->secondsUntilResendAllowed(),
            'remaining_attempts' => $record->remainingAttempts(),
            'remaining_resends' => max(0, (int) config('two_factor.resend_limit') - $record->resend_count),
        ];
    }
}
