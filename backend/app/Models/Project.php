<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute; // Import Attribute class

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'created_by',
        'budget',
        'currency'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
    ];

    // --- Relationships ---
    public function owner() // User who created the project
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    // Keep expenditures if still needed for non-task costs, otherwise remove
    public function expenditures()
    {
        return $this->hasMany(Expenditure::class);
    }

    // --- NEW/UPDATED ACCESSORS ---

    /**
     * Accessor: Calculate the total cost of all tasks for the project.
     */
    protected function totalTaskCost(): Attribute // New accessor name
    {
        return Attribute::make(
            // Sum the 'actual_cost' of related tasks.
            get: fn () => (float) $this->tasks()->sum('actual_cost'),
        );
    }

    /**
     * Accessor: Calculate the remaining budget based on TASK COSTS.
     * Returns null if the project budget is null.
     */
    protected function remainingBudget(): Attribute // Keep this name
    {
        return Attribute::make(
            get: function ($value) { // Access original value if needed, though not used here
                // Return null if the project budget itself is not set
                if ($this->budget === null) {
                    return null;
                }
                // Use the new totalTaskCost accessor
                return (float) ($this->budget - $this->total_task_cost);
            }
        );
    }

    // --- REMOVE OLD ACCESSOR ---
    /*
    // Remove this old accessor if it exists and is no longer the primary calculation
    protected function totalExpenditure(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->expenditures()->sum('amount'),
        );
    }
    */


    // --- UPDATE APPENDS ---
    // Append the *new* calculated properties to model's array/JSON form
    protected $appends = [
        'total_task_cost', // <-- Add this
        'remaining_budget' // <-- Keep this (its logic was updated)
        // 'total_expenditure', // <-- REMOVE THIS
    ];
}