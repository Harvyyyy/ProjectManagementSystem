<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Expenditure;
use App\Models\Project; // Keep Project model import for nested routes and authorization checks
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate; // Import Gate for authorization example

class ExpenditureController extends Controller
{
    /**
     * Display a listing of the resource for a specific project.
     * Corresponds to nested route: GET /api/projects/{project}/expenditures
     */
    public function index(Project $project)
    {
        // Optional: Add authorization check to ensure user can view this project
        // Gate::authorize('view', $project);

        $expenditures = $project->expenditures()
                                ->with('recorder:id,name') // Load user who recorded time efficiently
                                ->latest('expense_date') // Order by date
                                ->paginate(15); // Paginate results

        return response()->json($expenditures);
    }

    /**
     * Store a newly created resource in storage for a specific project.
     * Corresponds to nested route: POST /api/projects/{project}/expenditures
     */
    public function store(Request $request, Project $project)
    {
         // Optional: Add authorization check to ensure user can add expenditures to this project
         // Gate::authorize('addExpenditure', $project); // Example specific ability
         // Or check project ownership/membership:
         // if (!Auth::user()->canManageProject($project)) return response()->json(['message' => 'Unauthorized'], 403);


        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:65535',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date|before_or_equal:today', // Example validation
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->validated();
        $validatedData['recorded_by'] = Auth::id(); // Set the recorder

        // Create the expenditure associated with the project
        $expenditure = $project->expenditures()->create($validatedData);

        $expenditure->load('recorder:id,name'); // Load relation efficiently

        return response()->json($expenditure, 201);
    }

    /**
     * Display the specified resource.
     * NOTE: Correct signature for shallow GET route /api/expenditures/{expenditure}
     */
    public function show(Expenditure $expenditure) // Only receives Expenditure due to shallow route
    {
        // --- AUTHORIZATION NEEDED ---
        // Check if the logged-in user can view this expenditure
        // Example using Policy (assuming ExpenditurePolicy exists with 'view' method):
        // Gate::authorize('view', $expenditure);
        // Example checking project ownership:
        // if (Auth::id() !== $expenditure->project->created_by /* && !is project member */ ) {
        //     return response()->json(['message' => 'Forbidden'], 403);
        // }
        // --- END AUTHORIZATION ---

        // Load relations efficiently
        $expenditure->load('recorder:id,name', 'project:id,name'); // Load project info too
        return response()->json($expenditure);
    }

    /**
     * Update the specified resource in storage.
     * NOTE: Correct signature for shallow PUT route /api/expenditures/{expenditure}
     */
    public function update(Request $request, Expenditure $expenditure) // Only receives Request and Expenditure
    {
        // --- AUTHORIZATION NEEDED ---
        // Check if the logged-in user can update THIS specific expenditure
        // Example using Policy:
        // Gate::authorize('update', $expenditure);
        // Example checking ownership or recorder:
        // if (Auth::id() !== $expenditure->recorded_by && Auth::id() !== $expenditure->project->created_by) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
        // --- END AUTHORIZATION ---


        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string|max:65535',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'expense_date' => 'sometimes|required|date|before_or_equal:today',
            // Do not allow changing project_id or recorded_by easily here
        ]);

         if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
         }

        $expenditure->update($validator->validated());
        $expenditure->load('recorder:id,name'); // Reload recorder info

        return response()->json($expenditure);
    }

    /**
     * Remove the specified resource from storage.
     * NOTE: Correct signature for shallow DELETE route /api/expenditures/{expenditure}
     */
    public function destroy(Expenditure $expenditure) // Only receives Expenditure
    {
        // --- AUTHORIZATION NEEDED ---
        // Check if the logged-in user can delete THIS specific expenditure
        // Example using Policy:
        // Gate::authorize('delete', $expenditure);
        // Example checking ownership or recorder:
        // if (Auth::id() !== $expenditure->recorded_by && Auth::id() !== $expenditure->project->created_by) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
        // --- END AUTHORIZATION ---

        $expenditure->delete();

        return response()->json(null, 204); // No Content on successful delete
    }
}