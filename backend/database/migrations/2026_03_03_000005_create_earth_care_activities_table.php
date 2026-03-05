<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earth_care_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('activity_type', ['composting', 'planting', 'pesticide_free', 'water_conservation']);
            $table->text('description')->nullable();
            $table->string('photo_hash')->nullable();
            $table->decimal('gps_lat', 10, 7)->nullable();
            $table->decimal('gps_lng', 10, 7)->nullable();
            $table->unsignedInteger('approval_count')->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('sbt_token_id')->nullable();
            $table->timestamps();

            $table->index(['community_id', 'status']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earth_care_activities');
    }
};
