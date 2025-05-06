<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Project;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate; // Import Gate if you plan to use Policies/Abilities
use Illuminate\Support\Facades\Log; // Import Log facade for error logging
use Exception; // Import base Exception class

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     * Loads necessary relations including created_at and completed_at implicitly.
     */
    public function index(Request $request)
    {
        try {
            $query = Task::query();

            // Filter tasks by project if project_id is provided
            if ($request->has('project_id')) {
                 $projectId = $request->query('project_id');
                 $project = Project::find($projectId);
                 if (!$project) {
                     return response()->json(['message' => 'Project not found'], 404);
                 }
                 // Optional: Check if user can view this project's tasks
                 // Gate::authorize('view', $project);
                 $query->where('project_id', $projectId);
            } else {
                 // Default: Filter by tasks assigned to the user or created by the user
                 $userId = auth('sanctum')->id();
                 if($userId) {
                     $query->where(function($q) use ($userId) {
                         $q->where('assigned_user_id', $userId)
                           ->orWhere('created_by', $userId); // Make sure 'created_by' exists and is tracked
                     });
                 } else {
                    // Unauthenticated users likely shouldn't see any tasks
                    return response()->json(['message' => 'Authentication required'], 401);
                 }
            }

            // Eager load relationships efficiently
            // created_at and completed_at are standard timestamps, no need to manually load
            // duration accessor is appended in the Task model
            $tasks = $query->with([
                             'project:id,name,currency', // Load necessary project info
                             'assignedUser:id,name',     // Load assignee info
                             'owner:id,name'             // Load creator info
                           ])
                           ->latest() // Order by latest task created
                           ->get();

            // Return JSON (empty array if no tasks found)
            return response()->json($tasks ?? []);

        } catch (Exception $e) {
            Log::error("Error fetching tasks in TaskController@index: " . $e->getMessage() . " Stack: " . $e->getTraceAsString());
            return response()->json(['message' => 'Failed to retrieve tasks due to a server error.'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     * Sets default status to 'pending' and completed_at to null.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'assigned_user_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $validatedData = $validator->validated();

            $validatedData['created_by'] = auth('sanctum')->id(); // Set creator
            $validatedData['status'] = 'pending'; // Force default status
            $validatedData['priority'] = $validatedData['priority'] ?? 'medium'; // Default priority
            $validatedData['completed_at'] = null; // Ensure completed_at is null initially

            // Optional: Authorization check - can user add task to this project?
            // $project = Project::find($validatedData['project_id']);
            // Gate::authorize('addTask', $project);

            $task = Task::create($validatedData);

            // Load relations needed by frontend for the newly created task
            $task->load(['project:id,name,currency', 'assignedUser:id,name', 'owner:id,name']);
            return response()->json($task, 201);

        } catch (Exception $e) {
             Log::error("Error creating task in TaskController@store: " . $e->getMessage());
             return response()->json(['message' => 'Failed to create task due to a server error.'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
         try {
            // Optional: Authorization check - can user view this specific task?
            // Gate::authorize('view', $task);

            // Load relations needed by frontend
            return response()->json($task->load(['project:id,name,currency', 'assignedUser:id,name', 'owner:id,name']));
         } catch (Exception $e) {
             Log::error("Error showing task {$task->id} in TaskController@show: " . $e->getMessage());
             return response()->json(['message' => 'Failed to retrieve task details.'], 500);
         }
    }

    /**
     * Update the specified resource in storage.
     * Allows updating status, but use markAsComplete/undoComplete for completion timestamp logic.
     */
    public function update(Request $request, Task $task)
    {
         // Optional: Authorization check - can user update this task?
         // Gate::authorize('update', $task);

         $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['sometimes','required', Rule::in(['pending', 'in progress', 'completed'])], // Allow status update
            'priority' => ['sometimes','required', Rule::in(['low', 'medium', 'high'])],
            'assigned_user_id' => 'nullable|exists:users,id', // Allow changing assignee (or setting to null)
            'due_date' => 'nullable|date|after_or_equal:today',
         ]);

         if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
         }

         try {
             $validatedData = $validator->validated();
             // Prevent changing fields not meant for standard update via mass assignment
             unset($validatedData['created_by'], $validatedData['project_id'], $validatedData['completed_at']);

             // If status is changed AWAY from 'completed' via this update route, clear completed_at
             if (isset($validatedData['status']) && $validatedData['status'] !== 'completed' && $task->completed_at !== null) {
                 $task->completed_at = null;
             }
             // Note: We don't automatically set completed_at if status becomes 'completed' here.
             // The dedicated 'markAsComplete' route handles that logic.

             $task->update($validatedData);

             // Reload or just load relations if update doesn't automatically refresh them
             return response()->json($task->refresh()->load(['project:id,name,currency', 'assignedUser:id,name', 'owner:id,name']));
         } catch (Exception $e) {
              Log::error("Error updating task {$task->id} in TaskController@update: " . $e->getMessage());
              return response()->json(['message' => 'Failed to update task due to a server error.'], 500);
         }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
         // Optional: Authorization check
         // Gate::authorize('delete', $task);
         try {
            $task->delete();
            return response()->json(null, 204); // No Content
         } catch (Exception $e) {
             Log::error("Error deleting task {$task->id} in TaskController@destroy: " . $e->getMessage());
             return response()->json(['message' => 'Failed to delete task.'], 500);
         }
    }


    // --- REMOVED Timer Methods ---
    // public function startTimer(Task $task) { ... }
    // public function stopTimer(Task $task) { ... }


    // --- Mark as Complete / Undo Methods ---
    /**
     * Mark a task as complete and record the completion timestamp.
     * Corresponds to route: POST /api/tasks/{task}/complete
     */
    public function markAsComplete(Task $task)
    {
        // Authorization check
        // Gate::authorize('complete', $task); // Example using a policy/ability
         if (Auth::id() !== $task->assigned_user_id && Auth::id() !== $task->project->created_by) { // Basic check
             return response()->json(['message' => 'Unauthorized to complete this task'], 403);
         }

        if ($task->status === 'completed') {
            return response()->json(['message' => 'Task is already completed.'], 400);
        }

        try {
            $task->update([
                'status' => 'completed',
                'completed_at' => now() // Record completion time
            ]);

            // Refresh and load relations for the response
            $updatedTask = $task->refresh()->load([
                'project:id,name,currency', 'assignedUser:id,name', 'owner:id,name'
            ]);
            return response()->json($updatedTask);

        } catch (Exception $e) {
            Log::error("Error marking task {$task->id} as complete: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Failed to mark task as complete.'], 500);
        }
    }

    /**
     * Revert a completed task back to 'in progress' status.
     * Corresponds to route: POST /api/tasks/{task}/undo-complete
     */
    public function undoComplete(Task $task)
    {
        // Authorization check
        // Gate::authorize('update', $task); // Can use general update permission or specific undo
         if (Auth::id() !== $task->assigned_user_id && Auth::id() !== $task->project->created_by) { // Basic check
             return response()->json(['message' => 'Unauthorized to modify this task'], 403);
         }

        if ($task->status !== 'completed') {
            return response()->json(['message' => 'Task is not marked as completed.'], 400);
        }

        try {
            $task->update([
                'status' => 'in progress', // Revert to 'in progress'
                'completed_at' => null // Clear the completion timestamp
            ]);

            $updatedTask = $task->refresh()->load([ 'project:id,name,currency', 'assignedUser:id,name', 'owner:id,name' ]);
            return response()->json($updatedTask);

        } catch (Exception $e) {
            Log::error("Error undoing completion for task {$task->id}: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Failed to undo task completion.'], 500);
        }
    }


    // --- Other Methods (projectTasks, tasksByStatus) ---
    public function projectTasks(Project $project)
    {
        // Optional: Gate::authorize('view', $project);
        try {
             $tasks = $project->tasks()
                         ->with(['assignedUser:id,name', 'owner:id,name'])
                         ->latest()->get();
             return response()->json($tasks ?? []);
        } catch (Exception $e) {
            Log::error("Error fetching tasks for project {$project->id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve project tasks.'], 500);
        }
    }

    public function tasksByStatus($status)
    {
       try {
            // Add user filtering if needed based on your application's logic
            $userId = auth('sanctum')->id();
            $query = Task::where('status', $status);
            // if ($userId) { $query->where(function($q) use ($userId) { ... }); }

            $tasks = $query->with(['project:id,name,currency', 'assignedUser:id,name', 'owner:id,name'])
                           ->latest()->get();
            return response()->json($tasks ?? []);
        } catch (Exception $e) {
            Log::error("Error fetching tasks by status '{$status}': " . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve tasks by status.'], 500);
        }
    }
}