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
        Schema::table('tasks', function (Blueprint $table) {
            // Add actual_cost column after 'priority' or another suitable column
            // Use decimal for monetary values. Adjust precision/scale as needed.
            $table->decimal('actual_cost', 10, 2) // Example: Up to 99,999,999.99
                  ->nullable() // Allow tasks to initially have no cost
                  ->default(0.00) // Default to 0
                  ->after('priority'); // Place it logically in the table structure
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the column if migration is rolled back
            $table->dropColumn('actual_cost');
        });
    }
};