<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'date_worked',
        'duration', // in minutes
        'description',
    ];

    protected $casts = [
        'date_worked' => 'date',
        'duration' => 'integer',
    ];

    // Relationship to Task
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    // Relationship to User (who logged the time)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}