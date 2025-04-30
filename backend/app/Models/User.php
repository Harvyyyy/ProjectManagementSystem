<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany; // Optional: Add for type hinting

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable; // Existing traits are correct

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string> // Updated docblock type hint
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string> // Updated docblock type hint
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // Correct casting for password hashing
        ];
    }

    // --- Existing Relationships (Keep As Is) ---

    /**
     * Get the projects created by the user.
     */
    public function createdProjects(): HasMany // Optional type hint
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * Get the tasks assigned to the user.
     * NOTE: Your provided code used 'assigned_to', ensure your tasks table uses 'assigned_user_id'
     *       If it's 'assigned_user_id', this relationship should be:
     *       return $this->hasMany(Task::class, 'assigned_user_id');
     */
    public function assignedTasks(): HasMany // Optional type hint
    {
        // VERIFY this foreign key matches your tasks table schema ('assigned_user_id' is common)
        return $this->hasMany(Task::class, 'assigned_user_id'); // Assuming 'assigned_user_id' is correct FK
    }


    /**
     * Get the tasks created by the user.
     */
    public function createdTasks(): HasMany // Optional type hint
    {
        // Assuming 'created_by' in tasks table links to user id
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * The projects that the user is a member of (if using pivot table).
     * If this isn't used or set up differently, it might need adjustment or removal.
     */
    public function projects() // Needs return type hint like BelongsToMany if used
    {
        // Assuming a pivot table like 'project_user' exists
        return $this->belongsToMany(Project::class); // Add pivot table name if non-standard
    }


    // --- NEW RELATIONSHIP for Time Tracking ---

    /**
     * Get all the time entries recorded by the user.
     */
    public function timeEntries(): HasMany // Optional type hint
    {
        // Assumes 'user_id' foreign key exists on the 'time_entries' table
        return $this->hasMany(TimeEntry::class);
    }
    // --- END NEW RELATIONSHIP ---
}