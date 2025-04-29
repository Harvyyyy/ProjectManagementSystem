<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\ProjectController;
use App\Http\Controllers\api\TaskController;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\UserController;
use App\Http\Controllers\api\ExpenditureController; // Import new controller

Route::middleware('auth:sanctum')->group(function () {
    // Existing Project routes (no changes needed here for budget itself, handled in controller)
    Route::apiResource('projects', ProjectController::class);

    // Nested routes for Expenditures under Projects
    // GET /api/projects/{project}/expenditures - List expenditures for a project
    // POST /api/projects/{project}/expenditures - Create expenditure for a project
    // GET /api/projects/{project}/expenditures/{expenditure} - Show specific expenditure
    // PUT/PATCH /api/projects/{project}/expenditures/{expenditure} - Update specific expenditure
    // DELETE /api/projects/{project}/expenditures/{expenditure} - Delete specific expenditure
    Route::apiResource('projects.expenditures', ExpenditureController::class)->shallow();
    // ->shallow() makes routes for show, update, destroy not nested
    // e.g., GET /api/expenditures/{expenditure} instead of /api/projects/{project}/expenditures/{expenditure}
    // Choose based on preference. Keeping them nested (without shallow) is also fine.


    // Existing Task routes
    Route::get('projects/{project}/tasks', [TaskController::class, 'projectTasks']); // List tasks for project
    Route::apiResource('tasks', TaskController::class); // Standard task CRUD
    Route::get('tasks/status/{status}', [TaskController::class, 'tasksByStatus']); // Filter tasks

    // User routes
    Route::get('/users', [UserController::class, 'index']); // List users (for assignment etc.)

    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Public routes (Login/Register)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// REMOVE these duplicate routes outside the auth middleware if they exist
// Route::apiResource('projects', ProjectController::class);
// Route::apiResource('tasks', TaskController::class);