<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute; // Keep this import
use Illuminate\Database\Eloquent\Relations\HasMany; // Optional: Type hints
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Optional: Type hints

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name', // Ensure name is fillable
        'description',
        'start_date',
        'end_date',
        'status',
        'created_by',
        'budget',
        'currency'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2', // Cast budget to handle currency correctly
        // Timestamps (created_at, updated_at) are automatically handled as datetimes
    ];

    // --- Relationships ---

    /**
     * Get the user who created the project.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the tasks associated with the project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the expenditures associated with the project.
     */
    public function expenditures(): HasMany
    {
        return $this->hasMany(Expenditure::class);
    }

    // --- Accessors ---

    /**
     * Accessor: Calculate the total expenditure amount for the project.
     */
    protected function totalExpenditure(): Attribute
    {
        return Attribute::make(
            // Sum the 'amount' from related expenditures
            get: fn () => (float) $this->expenditures()->sum('amount'),
        );
    }

    /**
     * Accessor: Calculate the remaining budget based on EXPENDITURES.
     * Returns null if the project budget is null.
     */
    protected function remainingBudget(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->budget === null) {
                    return null; // No budget means remaining is undefined
                }
                // Use the totalExpenditure accessor defined above
                return (float) ($this->budget - $this->totalExpenditure);
            }
        );
    }

    /**
     * Accessor: Calculate the progress percentage based on completed tasks.
     */
    protected function progressPercentage(): Attribute // Method name matches appended property
    {
        return Attribute::make(
            get: function ($value) { // $value is the original db column value (null here)
                // Eager load counts for efficiency if accessing this for many projects
                // $this->loadCount(['tasks', 'completedTasks' => function ($query) {
                //    $query->where('status', 'completed');
                // }]);
                // $totalTasks = $this->tasks_count;
                // $completedTasks = $this->completed_tasks_count;

                // Simpler version (less efficient for lists, fine for single model)
                $totalTasks = $this->tasks()->count(); // Count all tasks for this project

                if ($totalTasks === 0) {
                    return 0; // No tasks means 0% progress
                }
                $completedTasks = $this->tasks()->where('status', 'completed')->count();

                // Calculate percentage, round to nearest integer
                return (int) round(($completedTasks / $totalTasks) * 100);
            }
        );
    }

    // --- Appends ---
    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'total_expenditure',    // For budget tracking based on expenditures
        'remaining_budget',     // Calculated based on total_expenditure
        'progress_percentage'   // <-- ADDED for progress tracking
    ];
}