<?php

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('health', [HealthController::class, 'show'])->name('api.v1.health');

    Route::prefix('auth')->name('api.v1.auth.')->group(function (): void {
        Route::post('login', [LoginController::class, 'store'])
            ->middleware('throttle:auth-login')
            ->name('login');

        Route::post('two-factor/verify', [TwoFactorController::class, 'verify'])
            ->middleware('throttle:auth-two-factor')
            ->name('two-factor.verify');

        Route::post('two-factor/resend', [TwoFactorController::class, 'resend'])
            ->middleware('throttle:auth-two-factor-resend')
            ->name('two-factor.resend');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('me', [SessionController::class, 'show'])->name('me');
            Route::post('logout', [SessionController::class, 'destroy'])->name('logout');
            Route::post('logout-all', [SessionController::class, 'destroyAll'])->name('logout-all');
        });
    });

    /*
     * Public content endpoints are registered here in phase F6.
     * Admin CRUD endpoints (auth:sanctum + permission middleware) arrive in phase F3.
     */
});
