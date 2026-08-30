<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends BaseApiController
{
    public function show(): JsonResponse
    {
        $databaseConnected = true;

        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $databaseConnected = false;
        }

        return $this->respondSuccess([
            'application' => config('app.name'),
            'environment' => config('app.env'),
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database_connected' => $databaseConnected,
            'default_locale' => $databaseConnected ? Locale::defaultCode() : config('app.fallback_locale'),
            'active_locales' => $databaseConnected ? Locale::activeCodes() : [],
            'timestamp' => now()->toIso8601String(),
        ], 'Service is healthy.');
    }
}
