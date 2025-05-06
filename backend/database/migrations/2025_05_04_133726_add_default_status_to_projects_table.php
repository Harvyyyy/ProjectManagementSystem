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
            // Modify existing column to add default
            $table->string('status')->default('Not Started')->change(); // Or your preferred default
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Revert change (might need to know the previous state)
            $table->string('status')->default(null)->change(); // Or remove default if appropriate
        });
    }
};
