<?php

use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\ProjectCategoryController;
use App\Http\Controllers\Api\V1\Admin\ProjectController;
use App\Http\Controllers\Api\V1\Admin\TechnologyController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PublicApi\PublicProjectController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('health', [HealthController::class, 'show'])->name('api.v1.health');

    Route::prefix('auth')->name('api.v1.auth.')->group(function (): void {
        Route::post('login', [LoginController::class, 'store'])
            ->middleware('throttle:auth-login')->name('login');

        Route::post('two-factor/verify', [TwoFactorController::class, 'verify'])
            ->middleware('throttle:auth-two-factor')->name('two-factor.verify');

        Route::post('two-factor/resend', [TwoFactorController::class, 'resend'])
            ->middleware('throttle:auth-two-factor-resend')->name('two-factor.resend');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('me', [SessionController::class, 'show'])->name('me');
            Route::post('logout', [SessionController::class, 'destroy'])->name('logout');
            Route::post('logout-all', [SessionController::class, 'destroyAll'])->name('logout-all');
        });
    });

    Route::prefix('public')->name('api.v1.public.')->group(function (): void {
        Route::get('projects', [PublicProjectController::class, 'index'])->name('projects.index');
        Route::get('projects/{slug}', [PublicProjectController::class, 'show'])->name('projects.show');
        Route::get('project-categories', [PublicProjectController::class, 'categories'])->name('project-categories.index');
    });

    Route::prefix('admin')->name('api.v1.admin.')->middleware('auth:sanctum')->group(function (): void {
        Route::get('projects', [ProjectController::class, 'index'])
            ->middleware('permission:projects.view')->name('projects.index');
        Route::post('projects', [ProjectController::class, 'store'])
            ->middleware('permission:projects.create')->name('projects.store');
        Route::post('projects/reorder', [ProjectController::class, 'reorder'])
            ->middleware('permission:projects.update')->name('projects.reorder');
        Route::get('projects/{project}', [ProjectController::class, 'show'])
            ->middleware('permission:projects.view')->name('projects.show');
        Route::match(['put', 'patch'], 'projects/{project}', [ProjectController::class, 'update'])
            ->middleware('permission:projects.update')->name('projects.update');
        Route::patch('projects/{project}/toggle-active', [ProjectController::class, 'toggleActive'])
            ->middleware('permission:projects.update')->name('projects.toggle-active');
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])
            ->middleware('permission:projects.delete')->name('projects.destroy');
        Route::post('projects/{project}/restore', [ProjectController::class, 'restore'])
            ->middleware('permission:projects.restore')->name('projects.restore');
        Route::delete('projects/{project}/force', [ProjectController::class, 'forceDestroy'])
            ->middleware('permission:projects.force_delete')->name('projects.force-destroy');

        Route::get('project-categories', [ProjectCategoryController::class, 'index'])
            ->middleware('permission:project_categories.view')->name('project-categories.index');
        Route::post('project-categories', [ProjectCategoryController::class, 'store'])
            ->middleware('permission:project_categories.create')->name('project-categories.store');
        Route::match(['put', 'patch'], 'project-categories/{category}', [ProjectCategoryController::class, 'update'])
            ->middleware('permission:project_categories.update')->name('project-categories.update');
        Route::delete('project-categories/{category}', [ProjectCategoryController::class, 'destroy'])
            ->middleware('permission:project_categories.delete')->name('project-categories.destroy');

        Route::get('technologies', [TechnologyController::class, 'index'])
            ->middleware('permission:technologies.view')->name('technologies.index');
        Route::post('technologies', [TechnologyController::class, 'store'])
            ->middleware('permission:technologies.create')->name('technologies.store');
        Route::match(['put', 'patch'], 'technologies/{technology}', [TechnologyController::class, 'update'])
            ->middleware('permission:technologies.update')->name('technologies.update');
        Route::delete('technologies/{technology}', [TechnologyController::class, 'destroy'])
            ->middleware('permission:technologies.delete')->name('technologies.destroy');

        Route::get('media', [MediaController::class, 'index'])
            ->middleware('permission:media.view')->name('media.index');
        Route::post('media', [MediaController::class, 'store'])
            ->middleware('permission:media.create')->name('media.store');
        Route::delete('media/{medium}', [MediaController::class, 'destroy'])
            ->middleware('permission:media.delete')->name('media.destroy');
    });
});
