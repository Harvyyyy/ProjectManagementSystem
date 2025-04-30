<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\ProjectController;
use App\Http\Controllers\api\TaskController;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\UserController;
use App\Http\Controllers\api\ExpenditureController;
use App\Http\Controllers\api\TimeEntryController; // <-- IMPORT TimeEntryController

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authenticated Routes (Require Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {

    // === Project Routes ===
    Route::apiResource('projects', ProjectController::class);

    // === Expenditure Routes (Nested under Projects initially) ===
    // Note: If Task costs replace Expenditures entirely, these might be removed later.
    Route::apiResource('projects.expenditures', ExpenditureController::class)
         ->shallow(); // Keeps GET/POST nested, makes PUT/DELETE non-nested (e.g., /api/expenditures/{id})

    // === Task Routes ===
    Route::get('projects/{project}/tasks', [TaskController::class, 'projectTasks']); // List tasks for a specific project
    Route::get('tasks/status/{status}', [TaskController::class, 'tasksByStatus']); // Filter tasks by status
    Route::apiResource('tasks', TaskController::class); // Standard Task CRUD (index, show, store, update, destroy)

    // === NEW: Time Entry Routes (Nested under Tasks) ===
    // Defines:
    // GET    /api/tasks/{task}/time-entries      -> TimeEntryController@index (List entries for a task)
    // POST   /api/tasks/{task}/time-entries      -> TimeEntryController@store (Create entry for a task)
    Route::apiResource('tasks.time-entries', TimeEntryController::class)
         ->only(['index', 'store']); // Only enabling list and create for now
    // If you need update/delete later, consider adding shallow() or defining separate routes
    // e.g., Route::apiResource('time-entries', TimeEntryController::class)->except(['index', 'store']);

    // === User Routes ===
    Route::get('/users', [UserController::class, 'index']); // List users (e.g., for task assignment dropdown)

    // === Auth Routes ===
    Route::post('/logout', [AuthController::class, 'logout']);

});

// Public Routes (No Authentication Required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Ensure no duplicate unauthenticated resource routes exist below