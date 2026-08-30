<?php

use App\Http\Controllers\Api\V1\Admin\FaqCategoryController;
use App\Http\Controllers\Api\V1\Admin\FaqController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\ProjectCategoryController;
use App\Http\Controllers\Api\V1\Admin\ProjectController;
use App\Http\Controllers\Api\V1\Admin\ServiceController;
use App\Http\Controllers\Api\V1\Admin\ServiceStatController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\TechnologyController;
use App\Http\Controllers\Api\V1\Admin\TestimonialController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MediaFileController;
use App\Http\Controllers\Api\V1\PublicApi\PublicContentController;
use App\Http\Controllers\Api\V1\PublicApi\PublicProjectController;
use Illuminate\Support\Facades\Route;

Route::get('storage/{path}', [MediaFileController::class, 'show'])
    ->where('path', '.*')
    ->name('api.storage.show');

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
        Route::get('testimonials', [PublicContentController::class, 'testimonials'])->name('testimonials.index');
        Route::get('services', [PublicContentController::class, 'services'])->name('services.index');
        Route::get('faqs', [PublicContentController::class, 'faqs'])->name('faqs.index');
        Route::get('settings', [PublicContentController::class, 'settings'])->name('settings.index');
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
        Route::post('project-categories/reorder', [ProjectCategoryController::class, 'reorder'])
            ->middleware('permission:project_categories.update')->name('project-categories.reorder');
        Route::get('project-categories/{category}', [ProjectCategoryController::class, 'show'])
            ->middleware('permission:project_categories.view')->name('project-categories.show');
        Route::match(['put', 'patch'], 'project-categories/{category}', [ProjectCategoryController::class, 'update'])
            ->middleware('permission:project_categories.update')->name('project-categories.update');
        Route::patch('project-categories/{category}/toggle-active', [ProjectCategoryController::class, 'toggleActive'])
            ->middleware('permission:project_categories.update')->name('project-categories.toggle-active');
        Route::delete('project-categories/{category}', [ProjectCategoryController::class, 'destroy'])
            ->middleware('permission:project_categories.delete')->name('project-categories.destroy');
        Route::post('project-categories/{category}/restore', [ProjectCategoryController::class, 'restore'])
            ->middleware('permission:project_categories.restore')->name('project-categories.restore');
        Route::delete('project-categories/{category}/force', [ProjectCategoryController::class, 'forceDestroy'])
            ->middleware('permission:project_categories.force_delete')->name('project-categories.force-destroy');

        Route::get('technologies', [TechnologyController::class, 'index'])
            ->middleware('permission:technologies.view')->name('technologies.index');
        Route::post('technologies', [TechnologyController::class, 'store'])
            ->middleware('permission:technologies.create')->name('technologies.store');
        Route::post('technologies/reorder', [TechnologyController::class, 'reorder'])
            ->middleware('permission:technologies.update')->name('technologies.reorder');
        Route::get('technologies/{technology}', [TechnologyController::class, 'show'])
            ->middleware('permission:technologies.view')->name('technologies.show');
        Route::match(['put', 'patch'], 'technologies/{technology}', [TechnologyController::class, 'update'])
            ->middleware('permission:technologies.update')->name('technologies.update');
        Route::patch('technologies/{technology}/toggle-active', [TechnologyController::class, 'toggleActive'])
            ->middleware('permission:technologies.update')->name('technologies.toggle-active');
        Route::delete('technologies/{technology}', [TechnologyController::class, 'destroy'])
            ->middleware('permission:technologies.delete')->name('technologies.destroy');
        Route::post('technologies/{technology}/restore', [TechnologyController::class, 'restore'])
            ->middleware('permission:technologies.restore')->name('technologies.restore');
        Route::delete('technologies/{technology}/force', [TechnologyController::class, 'forceDestroy'])
            ->middleware('permission:technologies.force_delete')->name('technologies.force-destroy');

        Route::get('media', [MediaController::class, 'index'])
            ->middleware('permission:media.view')->name('media.index');
        Route::post('media', [MediaController::class, 'store'])
            ->middleware('permission:media.create')->name('media.store');
        Route::get('media/{medium}', [MediaController::class, 'show'])
            ->middleware('permission:media.view')->name('media.show');
        Route::match(['put', 'patch'], 'media/{medium}', [MediaController::class, 'update'])
            ->middleware('permission:media.update')->name('media.update');
        Route::delete('media/{medium}', [MediaController::class, 'destroy'])
            ->middleware('permission:media.delete')->name('media.destroy');
        Route::post('media/{medium}/restore', [MediaController::class, 'restore'])
            ->middleware('permission:media.restore')->name('media.restore');
        Route::delete('media/{medium}/force', [MediaController::class, 'forceDestroy'])
            ->middleware('permission:media.force_delete')->name('media.force-destroy');

        Route::get('testimonials', [TestimonialController::class, 'index'])
            ->middleware('permission:testimonials.view')->name('testimonials.index');
        Route::post('testimonials', [TestimonialController::class, 'store'])
            ->middleware('permission:testimonials.create')->name('testimonials.store');
        Route::post('testimonials/reorder', [TestimonialController::class, 'reorder'])
            ->middleware('permission:testimonials.update')->name('testimonials.reorder');
        Route::get('testimonials/{testimonial}', [TestimonialController::class, 'show'])
            ->middleware('permission:testimonials.view')->name('testimonials.show');
        Route::match(['put', 'patch'], 'testimonials/{testimonial}', [TestimonialController::class, 'update'])
            ->middleware('permission:testimonials.update')->name('testimonials.update');
        Route::patch('testimonials/{testimonial}/toggle-active', [TestimonialController::class, 'toggleActive'])
            ->middleware('permission:testimonials.update')->name('testimonials.toggle-active');
        Route::delete('testimonials/{testimonial}', [TestimonialController::class, 'destroy'])
            ->middleware('permission:testimonials.delete')->name('testimonials.destroy');
        Route::post('testimonials/{testimonial}/restore', [TestimonialController::class, 'restore'])
            ->middleware('permission:testimonials.restore')->name('testimonials.restore');
        Route::delete('testimonials/{testimonial}/force', [TestimonialController::class, 'forceDestroy'])
            ->middleware('permission:testimonials.force_delete')->name('testimonials.force-destroy');

        Route::get('service-stats', [ServiceStatController::class, 'index'])
            ->middleware('permission:services.view')->name('service-stats.index');
        Route::post('service-stats', [ServiceStatController::class, 'store'])
            ->middleware('permission:services.create')->name('service-stats.store');
        Route::post('service-stats/reorder', [ServiceStatController::class, 'reorder'])
            ->middleware('permission:services.update')->name('service-stats.reorder');
        Route::match(['put', 'patch'], 'service-stats/{stat}', [ServiceStatController::class, 'update'])
            ->middleware('permission:services.update')->name('service-stats.update');
        Route::patch('service-stats/{stat}/toggle-active', [ServiceStatController::class, 'toggleActive'])
            ->middleware('permission:services.update')->name('service-stats.toggle-active');
        Route::delete('service-stats/{stat}', [ServiceStatController::class, 'destroy'])
            ->middleware('permission:services.delete')->name('service-stats.destroy');
        Route::post('service-stats/{stat}/restore', [ServiceStatController::class, 'restore'])
            ->middleware('permission:services.restore')->name('service-stats.restore');
        Route::delete('service-stats/{stat}/force', [ServiceStatController::class, 'forceDestroy'])
            ->middleware('permission:services.force_delete')->name('service-stats.force-destroy');

        Route::get('services', [ServiceController::class, 'index'])
            ->middleware('permission:services.view')->name('services.index');
        Route::post('services', [ServiceController::class, 'store'])
            ->middleware('permission:services.create')->name('services.store');
        Route::post('services/reorder', [ServiceController::class, 'reorder'])
            ->middleware('permission:services.update')->name('services.reorder');
        Route::get('services/{service}', [ServiceController::class, 'show'])
            ->middleware('permission:services.view')->name('services.show');
        Route::match(['put', 'patch'], 'services/{service}', [ServiceController::class, 'update'])
            ->middleware('permission:services.update')->name('services.update');
        Route::patch('services/{service}/toggle-active', [ServiceController::class, 'toggleActive'])
            ->middleware('permission:services.update')->name('services.toggle-active');
        Route::delete('services/{service}', [ServiceController::class, 'destroy'])
            ->middleware('permission:services.delete')->name('services.destroy');
        Route::post('services/{service}/restore', [ServiceController::class, 'restore'])
            ->middleware('permission:services.restore')->name('services.restore');
        Route::delete('services/{service}/force', [ServiceController::class, 'forceDestroy'])
            ->middleware('permission:services.force_delete')->name('services.force-destroy');

        Route::get('faq-categories', [FaqCategoryController::class, 'index'])
            ->middleware('permission:faqs.view')->name('faq-categories.index');
        Route::post('faq-categories', [FaqCategoryController::class, 'store'])
            ->middleware('permission:faqs.create')->name('faq-categories.store');
        Route::post('faq-categories/reorder', [FaqCategoryController::class, 'reorder'])
            ->middleware('permission:faqs.update')->name('faq-categories.reorder');
        Route::get('faq-categories/{category}', [FaqCategoryController::class, 'show'])
            ->middleware('permission:faqs.view')->name('faq-categories.show');
        Route::match(['put', 'patch'], 'faq-categories/{category}', [FaqCategoryController::class, 'update'])
            ->middleware('permission:faqs.update')->name('faq-categories.update');
        Route::patch('faq-categories/{category}/toggle-active', [FaqCategoryController::class, 'toggleActive'])
            ->middleware('permission:faqs.update')->name('faq-categories.toggle-active');
        Route::delete('faq-categories/{category}', [FaqCategoryController::class, 'destroy'])
            ->middleware('permission:faqs.delete')->name('faq-categories.destroy');
        Route::post('faq-categories/{category}/restore', [FaqCategoryController::class, 'restore'])
            ->middleware('permission:faqs.restore')->name('faq-categories.restore');
        Route::delete('faq-categories/{category}/force', [FaqCategoryController::class, 'forceDestroy'])
            ->middleware('permission:faqs.force_delete')->name('faq-categories.force-destroy');

        Route::get('faqs', [FaqController::class, 'index'])
            ->middleware('permission:faqs.view')->name('faqs.index');
        Route::post('faqs', [FaqController::class, 'store'])
            ->middleware('permission:faqs.create')->name('faqs.store');
        Route::post('faqs/reorder', [FaqController::class, 'reorder'])
            ->middleware('permission:faqs.update')->name('faqs.reorder');
        Route::get('faqs/{faq}', [FaqController::class, 'show'])
            ->middleware('permission:faqs.view')->name('faqs.show');
        Route::match(['put', 'patch'], 'faqs/{faq}', [FaqController::class, 'update'])
            ->middleware('permission:faqs.update')->name('faqs.update');
        Route::patch('faqs/{faq}/toggle-active', [FaqController::class, 'toggleActive'])
            ->middleware('permission:faqs.update')->name('faqs.toggle-active');
        Route::delete('faqs/{faq}', [FaqController::class, 'destroy'])
            ->middleware('permission:faqs.delete')->name('faqs.destroy');
        Route::post('faqs/{faq}/restore', [FaqController::class, 'restore'])
            ->middleware('permission:faqs.restore')->name('faqs.restore');
        Route::delete('faqs/{faq}/force', [FaqController::class, 'forceDestroy'])
            ->middleware('permission:faqs.force_delete')->name('faqs.force-destroy');

        Route::get('settings', [SettingController::class, 'index'])
            ->middleware('permission:settings.view')->name('settings.index');
        Route::match(['put', 'patch'], 'settings', [SettingController::class, 'update'])
            ->middleware('permission:settings.update')->name('settings.update');
    });
});
