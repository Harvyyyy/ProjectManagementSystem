<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::dropIfExists('time_entries'); // Drop the table
    }
    public function down(): void { // Recreate if rolling back
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date_worked');
            $table->unsignedInteger('duration'); // Duration in minutes
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }
};