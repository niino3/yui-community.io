<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 18, 8);
            $table->enum('tx_type', ['mint', 'transfer', 'demurrage', 'escrow']);
            $table->string('tx_hash', 66)->nullable()->unique();
            $table->enum('status', ['pending', 'confirmed', 'failed'])->default('pending');
            $table->timestamps();

            $table->index(['community_id', 'status']);
            $table->index('from_user_id');
            $table->index('to_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
