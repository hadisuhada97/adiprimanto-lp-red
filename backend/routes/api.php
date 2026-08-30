<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('health', [HealthController::class, 'show'])->name('api.v1.health');

    /*
     * Public endpoints (no authentication) are registered here in phase F6.
     * Admin endpoints (Sanctum + permission middleware) are registered here from phase F2 onwards.
     */
});
