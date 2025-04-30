<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
use App\Models\Task; // Import Task model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TimeEntryController extends Controller
{
    /**
     * Display a listing of the resource for a specific task.
     * GET /api/tasks/{task}/time-entries
     */
    public function index(Task $task)
    {
        // Optional: Authorization check - can user view this task's time?
        // Gate::authorize('view', $task);

        $timeEntries = $task->timeEntries()
                            ->with('user:id,name') // Load user who logged time
                            ->latest('date_worked') // Order by date worked
                            ->paginate(20); // Paginate results

        return response()->json($timeEntries);
    }

    /**
     * Store a newly created resource in storage for a specific task.
     * POST /api/tasks/{task}/time-entries
     */
    public function store(Request $request, Task $task)
    {
        // Optional: Authorization check - can user log time for this task?
        // Gate::authorize('logTime', $task); // Example custom ability

        $validator = Validator::make($request->all(), [
            'duration' => 'required|integer|min:1', // Duration in minutes, must be at least 1
            'date_worked' => 'required|date|before_or_equal:today', // Cannot log time for future
            'description' => 'nullable|string|max:65535',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();
        $validatedData['user_id'] = Auth::id(); // Use the authenticated user's ID
        // task_id is implicitly handled by creating through the relationship

        $timeEntry = $task->timeEntries()->create($validatedData);

        // Load user relationship for the response
        $timeEntry->load('user:id,name');

        return response()->json($timeEntry, 201);
    }

    // --- Optional: show, update, destroy methods for individual time entries ---
    // These would correspond to shallow routes if defined earlier

    /*
    public function show(TimeEntry $timeEntry)
    {
        // Authorization check
        // Gate::authorize('view', $timeEntry);
        $timeEntry->load('user:id,name', 'task:id,title');
        return response()->json($timeEntry);
    }

    public function update(Request $request, TimeEntry $timeEntry)
    {
        // Authorization check (e.g., only owner or project manager)
        // Gate::authorize('update', $timeEntry);

         $validator = Validator::make($request->all(), [
            'duration' => 'sometimes|required|integer|min:1',
            'date_worked' => 'sometimes|required|date|before_or_equal:today',
            'description' => 'nullable|string|max:65535',
        ]);

        if ($validator->fails()) { return response()->json(['errors' => $validator->errors()], 422); }

        $timeEntry->update($validator->validated());
        $timeEntry->load('user:id,name');

        return response()->json($timeEntry);
    }

    public function destroy(TimeEntry $timeEntry)
    {
         // Authorization check
         // Gate::authorize('delete', $timeEntry);

        $timeEntry->delete();
        return response()->json(null, 204);
    }
    */
}