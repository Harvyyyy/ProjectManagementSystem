<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expenditure extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'description',
        'amount',
        'expense_date',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2', // Cast amount to decimal
        'expense_date' => 'date', // Cast expense_date to Carbon date object
    ];

    // Define the relationship to the Project it belongs to
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Define the relationship to the User who recorded it
    public function recorder() // Renamed from 'user' to avoid potential conflicts
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}