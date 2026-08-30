<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('eyebrow', 16)->nullable();
            $table->string('icon_name', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('skill_category_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('skill_category_id')->constrained('skill_categories')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->timestamps();

            $table->unique(['skill_category_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('skill_category_id')->nullable()->constrained('skill_categories')->nullOnDelete();
            $table->string('name');
            $table->string('icon_name', 64)->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->unsignedTinyInteger('proficiency')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('pain_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('icon_name', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('pain_point_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pain_point_id')->constrained('pain_points')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['pain_point_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('process_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('icon_name', 64)->nullable();
            $table->unsignedInteger('step_number')->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('process_step_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('process_step_id')->constrained('process_steps')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['process_step_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('logo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('website_url')->nullable();
            $table->string('icon_name', 64)->nullable();
            $table->string('font_class')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('client_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('navigation_menus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('location', 16)->default('header');
            $table->foreignUuid('parent_id')->nullable()->constrained('navigation_menus')->nullOnDelete();
            $table->string('url')->nullable();
            $table->string('anchor')->nullable();
            $table->string('target', 16)->default('_self');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['location', 'is_active', 'sort_order']);
        });

        Schema::create('navigation_menu_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('navigation_menu_id')->constrained('navigation_menus')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->timestamps();

            $table->unique(['navigation_menu_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('contact_channels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 32)->default('custom');
            $table->string('value')->nullable();
            $table->string('url')->nullable();
            $table->string('icon_name', 64)->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('contact_channel_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contact_channel_id')->constrained('contact_channels')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->timestamps();

            $table->unique(['contact_channel_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('social_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('platform', 64);
            $table->string('url');
            $table->string('icon_name', 64)->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('seo_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('page_key')->unique();
            $table->foreignUuid('og_image_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('robots_directive', 64)->default('index,follow');
            $table->json('structured_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('seo_setting_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('seo_setting_id')->constrained('seo_settings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('meta_keywords')->nullable();
            $table->timestamps();

            $table->unique(['seo_setting_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_setting_translations');
        Schema::dropIfExists('seo_settings');
        Schema::dropIfExists('social_links');
        Schema::dropIfExists('contact_channel_translations');
        Schema::dropIfExists('contact_channels');
        Schema::dropIfExists('navigation_menu_translations');
        Schema::dropIfExists('navigation_menus');
        Schema::dropIfExists('client_translations');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('process_step_translations');
        Schema::dropIfExists('process_steps');
        Schema::dropIfExists('pain_point_translations');
        Schema::dropIfExists('pain_points');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('skill_category_translations');
        Schema::dropIfExists('skill_categories');
    }
};
