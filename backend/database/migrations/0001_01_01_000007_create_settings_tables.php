<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('group', 64)->default('general');
            $table->string('key', 128);
            $table->json('value')->nullable();
            $table->string('type', 32)->default('string');
            $table->boolean('is_public')->default(true);
            $table->boolean('is_translatable')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['group', 'key']);
        });

        Schema::create('setting_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('setting_id')->constrained('settings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['setting_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_translations');
        Schema::dropIfExists('settings');
    }
};
