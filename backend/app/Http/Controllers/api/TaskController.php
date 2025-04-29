<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Project;
use Illuminate\Support\Facades\Validator; // <-- Make sure Validator is imported

class TaskController extends Controller
{
    // index method remains the same as you provided
    public function index(Request $request)
    {
        // ... (your existing index logic is fine)
        $query = Task::query();

        // Filter tasks by project if project_id is provided
        if ($request->has('project_id')) {
             $projectId = $request->query('project_id');
             // Basic check if project exists
            if (!Project::find($projectId)) {
                 return response()->json(['message' => 'Project not found'], 404);
             }
            // Add further authorization checks if needed (e.g., user belongs to project)
             $query->where('project_id', $projectId);
        } else {
             // Optionally default to tasks assigned to user or created by user
             $userId = auth('sanctum')->id();
             if($userId) { // Ensure user is authenticated
                 $query->where(function($q) use ($userId) {
                     $q->where('assigned_user_id', $userId)
                       ->orWhere('created_by', $userId); // Assuming you track created_by
                 });
             } else {
                // Handle unauthenticated access if applicable, maybe return empty or error
                return response()->json(['message' => 'Authentication required to list tasks.'], 401);
             }
        }

        // Eager load relationships
        $tasks = $query->with(['project:id,name', 'assignedUser:id,name', 'owner:id,name'])->latest()->get(); // Select specific columns

        return response()->json($tasks);
    }

    // Store method updated
    public function store(Request $request)
    {
        // Use Validator::make for more control over response format
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['pending', 'in progress', 'completed'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'assigned_user_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after_or_equal:today', // Example: Due date cannot be in the past
            'actual_cost' => 'nullable|numeric|min:0', // <-- ADD VALIDATION
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422); // Return validation errors
        }

        $validatedData = $validator->validated(); // Get validated data

        // Add creator and defaults
        $validatedData['created_by'] = auth('sanctum')->id(); // Use sanctum guard explicitly if needed
        $validatedData['status'] = $validatedData['status'] ?? 'pending';
        $validatedData['priority'] = $validatedData['priority'] ?? 'medium';

        // --- HANDLE actual_cost ---
        // Set to null if not provided or empty string, otherwise cast to float
        $validatedData['actual_cost'] = $request->filled('actual_cost')
                                            ? (float) $validatedData['actual_cost']
                                            : null;
        // ---

        // Optional: Project access check (as before)
        // ...

        $task = Task::create($validatedData);

        // Load specific columns for efficiency
        return response()->json($task->load(['project:id,name', 'assignedUser:id,name', 'owner:id,name']), 201);
    }

    // Show method remains the same
    public function show(Task $task)
    {
         // ... (your existing show logic is fine)
         // Load specific columns
         return response()->json($task->load(['project:id,name,currency', 'assignedUser:id,name', 'owner:id,name']));
    }

    // Update method updated
    public function update(Request $request, Task $task)
    {
        // ... (Optional: Add authorization check) ...

        $validator = Validator::make($request->all(), [
             // No project_id update usually needed here
             'title' => 'sometimes|required|string|max:255',
             'description' => 'nullable|string',
             'status' => ['sometimes','required', Rule::in(['pending', 'in progress', 'completed'])],
             'priority' => ['sometimes','required', Rule::in(['low', 'medium', 'high'])],
             'assigned_user_id' => 'nullable|exists:users,id', // Allow assigning to null
             'due_date' => 'nullable|date|after_or_equal:today', // Example validation
             'actual_cost' => 'nullable|numeric|min:0', // <-- ADD VALIDATION
        ]);

         if ($validator->fails()) {
             return response()->json(['errors' => $validator->errors()], 422);
         }

        $validatedData = $validator->validated();

        // --- HANDLE actual_cost ---
        // Only update actual_cost if it was explicitly included in the request
        if ($request->has('actual_cost')) {
            $validatedData['actual_cost'] = $request->filled('actual_cost')
                                            ? (float) $validatedData['actual_cost']
                                            : null;
        }
        // ---

        // Prevent changing creator or project_id easily
        unset($validatedData['created_by'], $validatedData['project_id']);

        $task->update($validatedData);

        // Load specific columns
        return response()->json($task->load(['project:id,name', 'assignedUser:id,name', 'owner:id,name']));
    }

    // Destroy method remains the same
    public function destroy(Task $task)
    {
         // ... (your existing destroy logic is fine)
         $task->delete();
         return response()->json(null, 204); // Use 204 No Content for successful deletion
    }


    // projectTasks and tasksByStatus remain the same
    public function projectTasks($project_id)
    {
        // Consider adding authorization check if needed
         return Task::where('project_id', $project_id)
             ->with(['assignedUser:id,name', 'owner:id,name']) // Load needed relations efficiently
             ->get();
    }

    public function tasksByStatus($status)
    {
         // Consider filtering by user access as well
         return Task::where('status', $status)
             ->with(['project:id,name', 'assignedUser:id,name', 'owner:id,name']) // Load needed relations efficiently
             ->get();
    }
}