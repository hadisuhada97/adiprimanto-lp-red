<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('avatar_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignUuid('screenshot_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('accent_color', 9)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('source', 16)->default('manual');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('testimonial_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('testimonial_id')->constrained('testimonials')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->string('role')->nullable();
            $table->string('company')->nullable();
            $table->string('project_label')->nullable();
            $table->text('feedback');
            $table->timestamps();

            $table->unique(['testimonial_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('icon_name', 64)->nullable();
            $table->decimal('price_from', 12, 2)->nullable();
            $table->string('price_currency', 3)->nullable();
            $table->unsignedSmallInteger('duration_days')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('service_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'locale']);
            $table->index('locale');
        });

        Schema::create('service_stats', function (Blueprint $table) {
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

        Schema::create('service_stat_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_stat_id')->constrained('service_stats')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('unit')->nullable();
            $table->string('label')->nullable();
            $table->timestamps();

            $table->unique(['service_stat_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_stat_translations');
        Schema::dropIfExists('service_stats');
        Schema::dropIfExists('service_translations');
        Schema::dropIfExists('services');
        Schema::dropIfExists('testimonial_translations');
        Schema::dropIfExists('testimonials');
    }
};
