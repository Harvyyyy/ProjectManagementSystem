<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'title', 'description', 'status', 'priority',
        'assigned_user_id', 'created_by', 'due_date',
        // 'started_at', // REMOVED
        // 'ended_at',   // REMOVED
         'completed_at', // Keep in fillable IF you might ever set it directly (unlikely with this flow)
    ];

    protected $casts = [
        'due_date' => 'date',
        // 'started_at' => 'datetime', // REMOVED
        // 'ended_at' => 'datetime',   // REMOVED
        'completed_at' => 'datetime', // <-- ADDED
    ];

    // --- Relationships ---
    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function project(): BelongsTo { return $this->belongsTo(Project::class, 'project_id'); }
    public function assignedUser(): BelongsTo { return $this->belongsTo(User::class, 'assigned_user_id'); }

    // --- REMOVED Duration Accessor & Append ---
    // protected function duration(): Attribute { ... }
    // protected $appends = [ /* remove 'duration' */ ];
    protected $appends = []; // Clear appends if duration was the only one

    public function comments(): HasMany
    {
        // Order by oldest first, or 'latest()' for newest first
        return $this->hasMany(Comment::class)->orderBy('created_at', 'asc');
    }
}