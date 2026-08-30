<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('badge_icon', 64)->nullable();
            $table->foreignUuid('profile_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignUuid('cv_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('primary_cta_url')->nullable();
            $table->string('secondary_cta_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('hero_section_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('hero_section_id')->constrained('hero_sections')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('badge')->nullable();
            $table->string('role')->nullable();
            $table->string('headline_line_1')->nullable();
            $table->string('headline_highlight')->nullable();
            $table->string('headline_stroke')->nullable();
            $table->string('description_prefix')->nullable();
            $table->string('description_strong')->nullable();
            $table->string('description_suffix')->nullable();
            $table->string('primary_cta_label')->nullable();
            $table->string('secondary_cta_label')->nullable();
            $table->string('trusted_prefix')->nullable();
            $table->string('trusted_strong')->nullable();
            $table->string('trusted_suffix')->nullable();
            $table->timestamps();

            $table->unique(['hero_section_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('hero_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('value', 32);
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

        Schema::create('hero_metric_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('hero_metric_id')->constrained('hero_metrics')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->timestamps();

            $table->unique(['hero_metric_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('about_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->decimal('location_lat', 10, 7)->nullable();
            $table->decimal('location_lng', 10, 7)->nullable();
            $table->string('primary_cta_url')->nullable();
            $table->string('secondary_cta_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('about_section_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('about_section_id')->constrained('about_sections')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('eyebrow')->nullable();
            $table->string('location')->nullable();
            $table->string('headline')->nullable();
            $table->string('headline_highlight')->nullable();
            $table->text('bio_paragraph_1')->nullable();
            $table->text('bio_paragraph_2')->nullable();
            $table->text('bio_paragraph_3')->nullable();
            $table->string('primary_cta_label')->nullable();
            $table->string('secondary_cta_label')->nullable();
            $table->timestamps();

            $table->unique(['about_section_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('about_stats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('value', 32);
            $table->string('icon_name', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('about_stat_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('about_stat_id')->constrained('about_stats')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->string('sublabel')->nullable();
            $table->timestamps();

            $table->unique(['about_stat_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_stat_translations');
        Schema::dropIfExists('about_stats');
        Schema::dropIfExists('about_section_translations');
        Schema::dropIfExists('about_sections');
        Schema::dropIfExists('hero_metric_translations');
        Schema::dropIfExists('hero_metrics');
        Schema::dropIfExists('hero_section_translations');
        Schema::dropIfExists('hero_sections');
    }
};
