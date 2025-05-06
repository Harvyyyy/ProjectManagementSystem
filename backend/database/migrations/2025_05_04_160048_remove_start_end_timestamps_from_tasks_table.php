<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop columns if they exist
            if (Schema::hasColumn('tasks', 'started_at')) { $table->dropColumn('started_at'); }
            if (Schema::hasColumn('tasks', 'ended_at')) { $table->dropColumn('ended_at'); }
        });
    }
    public function down(): void { // Re-add if rolling back
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('due_date');
            $table->timestamp('ended_at')->nullable()->after('started_at');
        });
    }
};