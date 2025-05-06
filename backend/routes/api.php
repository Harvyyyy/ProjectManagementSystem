<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\ProjectController;
use App\Http\Controllers\api\TaskController;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\UserController;
use App\Http\Controllers\api\ExpenditureController;
use App\Http\Controllers\api\CommentController;
// TimeEntryController is not used

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authenticated Routes (Require Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {

    // === Project Routes ===
    Route::apiResource('projects', ProjectController::class);

    // === Expenditure Routes (Using shallow) ===
    Route::apiResource('projects.expenditures', ExpenditureController::class)
         ->shallow();

    // === Task Routes ===
    Route::get('projects/{project}/tasks', [TaskController::class, 'projectTasks']);
    Route::get('tasks/status/{status}', [TaskController::class, 'tasksByStatus']);

    // --- Task Completion Routes ---
    // Mark as Complete
    Route::post('tasks/{task}/complete', [TaskController::class, 'markAsComplete'])->name('tasks.complete');
    // Undo Completion
    Route::post('tasks/{task}/undo-complete', [TaskController::class, 'undoComplete'])->name('tasks.undoComplete');
    // --- END Completion Routes ---

    // Standard Task CRUD (index, show, store, update, destroy)
    // Note: store sets default 'pending' status, update allows status change
    Route::apiResource('tasks', TaskController::class);

    // === User Routes ===
    Route::get('/users', [UserController::class, 'index']); // List users

    // === Auth Routes ===
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('tasks.comments', CommentController::class)->only(['index', 'store']);

});

// Public Routes (No Authentication Required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Ensure no duplicate unauthenticated resource routes exist below