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
        Schema::table('projects', function (Blueprint $table) {
            // Add budget column - using decimal for precision with money
            $table->decimal('budget', 15, 2)->nullable()->after('status');
            // Add currency column (e.g., 'USD', 'EUR')
            $table->string('currency', 3)->nullable()->after('budget');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Drop columns if migration is rolled back
            $table->dropColumn(['budget', 'currency']);
        });
    }
};