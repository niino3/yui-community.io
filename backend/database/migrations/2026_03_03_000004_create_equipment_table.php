<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->decimal('daily_rate_token', 18, 8)->default(0);
            $table->enum('status', ['available', 'in_use', 'maintenance'])->default('available');
            $table->timestamps();

            $table->index(['community_id', 'status']);
        });

        Schema::create('equipment_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('token_amount', 18, 8)->default(0);
            $table->enum('status', ['reserved', 'active', 'returned', 'cancelled'])->default('reserved');
            $table->timestamps();

            $table->index(['equipment_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_reservations');
        Schema::dropIfExists('equipment');
    }
};
