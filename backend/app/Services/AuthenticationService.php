<?php

namespace App\Services;

use App\Enums\AuthEvent;
use App\Exceptions\AuthenticationFailedException;
use App\Models\User;
use App\Support\AuthActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthenticationService
{
    /** Hash used for constant-time comparison when the account does not exist. */
    protected const DUMMY_HASH = '$2y$12$Fq5Q1kO0nJ9tYyVQ0oGGmuZK4hHbYc0e5Z6bmT1UZ2yCkE8qkbCPO';

    public function __construct(
        protected TwoFactorService $twoFactorService,
    ) {}

    /**
     * Validate credentials. Returns a two-factor challenge, or the user when 2FA is disabled.
     *
     * @return array{requires_two_factor: bool, challenge: ?array, user: ?User}
     */
    public function authenticate(string $email, string $password, Request $request): array
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            // Always spend the same amount of time to avoid account enumeration.
            Hash::check($password, self::DUMMY_HASH);

            AuthActivityLogger::record(AuthEvent::LoginFailed, $request, null, [
                'email' => $email,
                'reason' => 'user_not_found',
            ]);

            throw new AuthenticationFailedException('These credentials do not match our records.', 401);
        }

        if ($user->isLocked()) {
            AuthActivityLogger::record(AuthEvent::AccountLockedOut, $request, $user, [
                'locked_until' => $user->locked_until->toIso8601String(),
            ]);

            throw new AuthenticationFailedException(
                'This account is temporarily locked because of too many failed sign-in attempts.',
                423,
                [
                    'locked_until' => $user->locked_until->toIso8601String(),
                    'retry_after_seconds' => (int) max(0, now()->diffInSeconds($user->locked_until, false)),
                ]
            );
        }

        if (! Hash::check($password, $user->password)) {
            $user->registerFailedLogin(
                (int) config('two_factor.login.max_attempts'),
                (int) config('two_factor.login.lockout_minutes')
            );

            AuthActivityLogger::record(AuthEvent::LoginFailed, $request, $user, [
                'reason' => 'invalid_password',
                'failed_login_attempts' => $user->failed_login_attempts,
            ]);

            if ($user->isLocked()) {
                AuthActivityLogger::record(AuthEvent::AccountLocked, $request, $user, [
                    'locked_until' => $user->locked_until->toIso8601String(),
                ]);

                throw new AuthenticationFailedException(
                    'Too many failed attempts. This account is locked for '
                        .config('two_factor.login.lockout_minutes').' minutes.',
                    423,
                    ['locked_until' => $user->locked_until->toIso8601String()]
                );
            }

            throw new AuthenticationFailedException('These credentials do not match our records.', 401, [
                'remaining_attempts' => max(
                    0,
                    (int) config('two_factor.login.max_attempts') - $user->failed_login_attempts
                ),
            ]);
        }

        if (! $user->is_active) {
            AuthActivityLogger::record(AuthEvent::LoginFailed, $request, $user, ['reason' => 'inactive_account']);

            throw new AuthenticationFailedException('This account has been deactivated.', 403);
        }

        // Password is correct: clear the failure counter before the second factor.
        if ($user->failed_login_attempts > 0) {
            $user->forceFill(['failed_login_attempts' => 0, 'locked_until' => null])->save();
        }

        if ($user->is_two_factor_enabled) {
            return [
                'requires_two_factor' => true,
                'challenge' => $this->twoFactorService->issueChallenge($user, $request),
                'user' => null,
            ];
        }

        return [
            'requires_two_factor' => false,
            'challenge' => null,
            'user' => $user,
        ];
    }

    /** Issue a Sanctum access token and record the successful sign-in. */
    public function issueAccessToken(User $user, string $deviceName, Request $request): array
    {
        $user->registerSuccessfulLogin($request->ip());

        $expiresAt = now()->addMinutes((int) config('sanctum.expiration'));

        $token = $user->createToken($deviceName, ['*'], $expiresAt);

        AuthActivityLogger::record(AuthEvent::LoginSucceeded, $request, $user, [
            'device_name' => $deviceName,
            'token_id' => $token->accessToken->getKey(),
        ]);

        return [
            'access_token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }
}
