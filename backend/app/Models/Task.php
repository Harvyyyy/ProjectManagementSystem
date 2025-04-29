<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'created_by', // Keep created_by if you set it manually/check authorization
        'due_date',
        'actual_cost', // <-- ADD THIS LINE
    ];

    protected $casts = [
        'due_date' => 'date',
        'actual_cost' => 'decimal:2', // <-- ADD THIS CAST for proper handling
    ];

    // --- Relationships ---
    public function owner() // User who created the task
    {
        // Assuming created_by links to users.id
        return $this->belongsTo(User::class, 'created_by');
        // If you don't track who created the task, you can remove this
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedUser() // User assigned to do the task
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}