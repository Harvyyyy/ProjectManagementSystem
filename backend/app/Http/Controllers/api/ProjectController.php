<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log; // Added for logging
use Exception; // Added for catching general exceptions

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     * Includes appended attributes like progress_percentage automatically.
     */
    public function index()
    {
         try {
             // Base query - consider eager loading 'owner' if frequently needed in the list
             $query = Project::query()->with('owner:id,name'); // Load owner efficiently

             // Example Filtering Logic (adjust based on your actual needs)
             // Show projects created by the user OR where the user is assigned to tasks within
             $userId = Auth::id();
             $query->where(function ($q) use ($userId) {
                 $q->where('created_by', $userId)
                   ->orWhereHas('tasks', function($taskQuery) use ($userId) {
                       $taskQuery->where('assigned_user_id', $userId);
                   });
             });

             // Optional: Eager load task count if needed for display (less critical now with progress %)
             // $query->withCount('tasks');

             $projects = $query->latest()->paginate(10); // Paginate results

             // 'total_expenditure', 'remaining_budget', 'progress_percentage' are appended automatically by the model
             return response()->json($projects);

         } catch (Exception $e) {
             Log::error("Error fetching projects in ProjectController@index: " . $e->getMessage());
             return response()->json(['message' => 'Failed to retrieve projects.'], 500);
         }
    }


    /**
     * Store a newly created resource in storage.
     * Sets default status to 'Not Started'.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            // Status is set automatically, no validation needed here
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $validatedData = $validator->validated(); // Get validated data

            $validatedData['status'] = 'Not Started'; // Force default status
            $validatedData['created_by'] = Auth::id(); // Set the creator

            $project = Project::create($validatedData);

            // Load owner if needed immediately by frontend after creation
            $project->load('owner:id,name');
             // Appended attributes (like progress_percentage=0) will be included
            return response()->json($project, 201);

        } catch (Exception $e) {
            Log::error("Error creating project in ProjectController@store: " . $e->getMessage());
            return response()->json(['message' => 'Failed to create project.'], 500);
        }
    }

    /**
     * Display the specified resource.
     * Includes appended attributes automatically.
     */
    public function show(Project $project)
    {
        try {
            // Optional: Add authorization check
            // Gate::authorize('view', $project);

             // Eager load relationships needed for the detail view
             // Appended attributes are calculated when the model is serialized
             $project->load(['owner:id,name', 'tasks', 'expenditures', 'expenditures.recorder:id,name']); // Example load

            return response()->json($project);

        } catch (Exception $e) {
             Log::error("Error showing project {$project->id} in ProjectController@show: " . $e->getMessage());
             return response()->json(['message' => 'Failed to retrieve project details.'], 500);
        }
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
         // Optional: Add authorization check
         // Gate::authorize('update', $project);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|required|in:Not Started,In Progress,On Hold,Completed', // Allow status update
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $validatedData = $validator->validated(); // Use validated data
             // Prevent accidental update of creator
            unset($validatedData['created_by']);

            $project->update($validatedData);

            // Reload relationships if needed after update
            $project->load(['owner:id,name', 'tasks', 'expenditures', 'expenditures.recorder:id,name']);
            // Appended attributes will be recalculated on serialization
            return response()->json($project);

        } catch (Exception $e) {
             Log::error("Error updating project {$project->id} in ProjectController@update: " . $e->getMessage());
             return response()->json(['message' => 'Failed to update project.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
     public function destroy(Project $project)
    {
        // Optional: Add authorization check
        // Gate::authorize('delete', $project);
        try {
            // Related tasks/expenditures might be deleted via cascade if set up in migrations,
            // otherwise, delete them manually first if required.
            // $project->tasks()->delete();
            // $project->expenditures()->delete();

            $project->delete();

            return response()->json(null, 204); // No content response

        } catch (Exception $e) {
             Log::error("Error deleting project {$project->id} in ProjectController@destroy: " . $e->getMessage());
             return response()->json(['message' => 'Failed to delete project.'], 500);
        }
    }
}