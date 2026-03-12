<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // communities テーブルに新しいカラムを追加
        Schema::table('communities', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('demurrage_rate');
            $table->string('logo_url')->nullable()->after('is_active');
            $table->string('color_primary', 7)->default('#22c55e')->after('logo_url');
            $table->string('color_secondary', 7)->default('#86efac')->after('color_primary');
            $table->string('locale', 5)->default('ja')->after('color_secondary');
            $table->text('token_rate_description')->nullable()->after('locale');
            $table->integer('max_members')->default(100)->after('token_rate_description');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('max_members');
        });

        // community_members テーブルに role カラムを追加
        Schema::table('community_members', function (Blueprint $table) {
            $table->enum('role', ['member', 'operator', 'admin'])->default('member')->after('status');
        });

        // contract_registry テーブルを新規作成
        Schema::create('contract_registry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->enum('contract_type', ['token', 'sbt', 'escrow', 'governance', 'treasury']);
            $table->string('address', 42);
            $table->timestamp('deployed_at')->useCurrent();
            $table->string('tx_hash', 66)->nullable();
            $table->timestamps();

            $table->unique(['community_id', 'contract_type']);
            $table->index('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_registry');

        Schema::table('community_members', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('communities', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'is_active',
                'logo_url',
                'color_primary',
                'color_secondary',
                'locale',
                'token_rate_description',
                'max_members',
                'created_by',
            ]);
        });
    }
};
