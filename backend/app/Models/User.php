<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable; // Correctly imported
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany; // Import HasMany
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // Import BelongsToMany

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // Notifiable trait is correctly included here
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
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
            'password' => 'hashed',
        ];
    }

    // --- Relationships ---

    /**
     * Get the projects created by the user.
     */
    public function createdProjects(): HasMany // Added return type
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * Get the tasks assigned to the user.
     * IMPORTANT: Verify that 'assigned_user_id' is the correct foreign key name
     * in your 'tasks' table schema.
     */
    public function assignedTasks(): HasMany // Added return type
    {
        // Ensure 'assigned_user_id' matches your database column name for the assignee's ID
        return $this->hasMany(Task::class, 'assigned_user_id');
    }


    /**
     * Get the tasks created by the user.
     */
    public function createdTasks(): HasMany // Added return type
    {
        // Assuming 'created_by' in tasks table links to user id
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * The projects that the user is a member of.
     * Assumes a pivot table named 'project_user'.
     */
    public function projects(): BelongsToMany // Added return type
    {
        // Specify pivot table name and keys if they differ from Laravel conventions
        return $this->belongsToMany(Project::class);
    }


    /**
     * Get all the comments made by the user.
     */
     public function comments(): HasMany // Added return type
     {
         // Assumes a 'user_id' foreign key on the comments table
         return $this->hasMany(Comment::class);
     }

}