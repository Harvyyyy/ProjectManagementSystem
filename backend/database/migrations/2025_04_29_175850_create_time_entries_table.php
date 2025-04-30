<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade'); // Link to tasks, delete entries if task is deleted
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Link to users, delete entries if user is deleted
            $table->date('date_worked');    // Date the work was done
            $table->unsignedInteger('duration'); // Duration in minutes
            $table->text('description')->nullable(); // Optional notes
            $table->timestamps(); // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};