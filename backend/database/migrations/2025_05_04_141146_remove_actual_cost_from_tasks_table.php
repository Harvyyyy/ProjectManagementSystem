<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'actual_cost')) { // Check if column exists before dropping
                $table->dropColumn('actual_cost');
            }
        });
    }
    public function down(): void { // How to revert the drop
        Schema::table('tasks', function (Blueprint $table) {
            $table->decimal('actual_cost', 10, 2)->nullable()->default(0.00)->after('priority');
        });
    }
};