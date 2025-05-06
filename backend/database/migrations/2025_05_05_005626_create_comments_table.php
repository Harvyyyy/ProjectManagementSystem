<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade'); // Link to task
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // User who commented
            $table->text('body'); // The comment content
            $table->timestamps(); // created_at, updated_at
        });
    }
    public function down(): void {
        Schema::dropIfExists('comments');
    }
};