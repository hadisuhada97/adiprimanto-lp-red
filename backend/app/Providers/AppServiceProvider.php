<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Support\ApiResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        Date::use(\Illuminate\Support\Carbon::class);

        Password::defaults(fn () => Password::min(12)->mixedCase()->numbers()->symbols());

        $this->configureRateLimiters();
    }

    protected function configureRateLimiters(): void
    {
        $tooManyRequests = fn (Request $request, array $headers = []) => ApiResponse::error(
            'Too many requests. Please try again later.',
            429
        )->withHeaders($headers + ['Retry-After' => 60]);

        RateLimiter::for('auth-login', fn (Request $request) => Limit::perMinute(5)
            ->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip())
            ->response($tooManyRequests));

        RateLimiter::for('auth-two-factor', fn (Request $request) => Limit::perMinute(10)
            ->by((string) $request->input('challenge_token').'|'.$request->ip())
            ->response($tooManyRequests));

        RateLimiter::for('auth-two-factor-resend', fn (Request $request) => Limit::perMinute(3)
            ->by((string) $request->input('challenge_token').'|'.$request->ip())
            ->response($tooManyRequests));

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->id ?: $request->ip())
            ->response($tooManyRequests));
    }
}
