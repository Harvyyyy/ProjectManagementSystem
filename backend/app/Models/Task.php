<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute; // Import if using new accessor syntax

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_user_id',
        'created_by',
        'due_date',
        'actual_cost',
    ];

    protected $casts = [
        'due_date' => 'date',
        'actual_cost' => 'decimal:2',
    ];

    // --- NEW: Relationship to Time Entries ---
    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }
    // --- END NEW ---


    // --- Relationships ---
    // ... (owner, project, assignedUser relationships remain) ...
    public function owner() { return $this->belongsTo(User::class, 'created_by'); }
    public function project() { return $this->belongsTo(Project::class); }
    public function assignedUser() { return $this->belongsTo(User::class, 'assigned_user_id'); }


    // --- NEW: Accessor for Total Time Spent ---
    /**
     * Calculate total time spent on this task in minutes.
     */
    public function getTotalTimeSpentAttribute(): int
    {
        // Sum the 'duration' from related time entries
        return (int) $this->timeEntries()->sum('duration');
    }
    // --- END NEW ---


    // --- UPDATE: Append the new accessor ---
    protected $appends = [
        'total_time_spent' // Add this
    ];
    // --- END UPDATE ---

}