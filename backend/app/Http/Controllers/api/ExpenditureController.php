<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Expenditure;
use App\Models\Project; // Import Project model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ExpenditureController extends Controller
{
    /**
     * Display a listing of the resource for a specific project.
     * We modify this from the default to accept a Project.
     */
    public function index(Project $project)
    {
        // Optional: Add authorization check to ensure user can view this project's expenditures
        // Gate::authorize('view', $project);

        // Get expenditures specifically for the given project, load recorder info
        $expenditures = $project->expenditures()->with('recorder')->latest()->paginate(15);

        return response()->json($expenditures);
    }

    /**
     * Store a newly created resource in storage for a specific project.
     * We modify this from the default to accept a Project.
     */
    public function store(Request $request, Project $project)
    {
         // Optional: Add authorization check to ensure user can add expenditures to this project
         // Gate::authorize('update', $project); // Or a specific 'addExpenditure' ability

        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:65535', // Use text max length
            'amount' => 'required|numeric|min:0.01', // Must be at least 0.01
            'expense_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();
        $validatedData['recorded_by'] = Auth::id(); // Set the recorder to the logged-in user
        // project_id is implicitly set by creating through the relationship
        $expenditure = $project->expenditures()->create($validatedData);

        $expenditure->load('recorder'); // Load recorder info for the response

        return response()->json($expenditure, 201);
    }

    /**
     * Display the specified resource.
     * Ensure the expenditure belongs to the correct project.
     */
    public function show(Project $project, Expenditure $expenditure)
    {
         // Optional: Add authorization check
         // Gate::authorize('view', $project);

        // Verify the expenditure belongs to the given project
        if ($expenditure->project_id !== $project->id) {
            return response()->json(['message' => 'Expenditure not found for this project.'], 404);
        }

        $expenditure->load('recorder');
        return response()->json($expenditure);
    }

    /**
     * Update the specified resource in storage.
     * Ensure the expenditure belongs to the correct project.
     */
    public function update(Request $request, Project $project, Expenditure $expenditure)
    {
        // Optional: Add authorization check
        // Gate::authorize('update', $project);

        // Verify the expenditure belongs to the given project
        if ($expenditure->project_id !== $project->id) {
            return response()->json(['message' => 'Expenditure not found for this project.'], 404);
        }

        // Optional: Check if the user is authorized to update *this specific* expenditure
        // (e.g., only the recorder or project manager)
        // if (Auth::id() !== $expenditure->recorded_by && !Auth::user()->isProjectManagerFor($project)) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }


        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string|max:65535',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'expense_date' => 'sometimes|required|date',
        ]);

         if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $expenditure->update($validator->validated());
        $expenditure->load('recorder'); // Reload recorder info

        return response()->json($expenditure);
    }

    /**
     * Remove the specified resource from storage.
     * Ensure the expenditure belongs to the correct project.
     */
    public function destroy(Project $project, Expenditure $expenditure)
    {
        // Optional: Add authorization check
        // Gate::authorize('update', $project); // Or delete permission

        // Verify the expenditure belongs to the given project
        if ($expenditure->project_id !== $project->id) {
            return response()->json(['message' => 'Expenditure not found for this project.'], 404);
        }

         // Optional: Check if the user is authorized to delete *this specific* expenditure
        // if (Auth::id() !== $expenditure->recorded_by && !Auth::user()->isProjectManagerFor($project)) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        $expenditure->delete();

        return response()->json(null, 204); // No Content
    }
}