<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator; // Import Validator

class ProjectController extends Controller
{
    // ... (index method - ensure it eager loads relationships if needed)

    public function index()
    {
         // Eager load owner and tasks count for efficiency if needed often
         // Add expenditures count or sum if desired for the list view
        $projects = Project::with('owner')
                            ->withCount('tasks') // Example: Get task count
                            // ->withSum('expenditures', 'amount') // Optionally get total spent here too
                            ->where('created_by', Auth::id()) // Example: Show only user's projects
                            ->orWhereHas('tasks', function($q){ // Example: Or projects with tasks assigned to user
                                $q->where('assigned_user_id', Auth::id());
                            })
                            ->latest()
                            ->paginate(10); // Paginate results

        return response()->json($projects);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:Not Started,In Progress,On Hold,Completed',
            'budget' => 'nullable|numeric|min:0', // Validation for budget
            'currency' => 'nullable|string|max:3' // Validation for currency (basic)
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project = Project::create(array_merge(
            $validator->validated(), // Use validated data
            ['created_by' => Auth::id()] // Set the creator
        ));

        // Load relationships before returning if needed immediately by frontend
        $project->load('owner');

        return response()->json($project, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        // Optionally add authorization check here (e.g., Gate::authorize('view', $project);)

         // Eager load relationships for the detail view
         // The accessors for total_expenditure and remaining_budget will be automatically included
         $project->load(['owner', 'tasks', 'expenditures', 'expenditures.recorder']);

        return response()->json($project);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
         // Optionally add authorization check here (e.g., Gate::authorize('update', $project);)

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:Not Started,In Progress,On Hold,Completed',
            'budget' => 'nullable|numeric|min:0', // Validation for budget
            'currency' => 'nullable|string|max:3' // Validation for currency
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project->update($validator->validated()); // Use validated data

        // Reload relationships if needed after update
        $project->load(['owner', 'tasks', 'expenditures', 'expenditures.recorder']);

        return response()->json($project);
    }

    // ... (destroy method)
     public function destroy(Project $project)
    {
        // Optionally add authorization check here (e.g., Gate::authorize('delete', $project);)

        // Related tasks and expenditures will be deleted automatically due to 'cascade' if set
        // If not using cascade, delete them manually first
        // $project->tasks()->delete();
        // $project->expenditures()->delete();

        $project->delete();

        return response()->json(null, 204); // No content response
    }
}