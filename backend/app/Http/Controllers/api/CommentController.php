<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Task;       
use App\Models\Comment;  
use Illuminate\Http\Request; 
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Events\CommentAddedToTask;

class CommentController extends Controller
{
    /**
     * Display a listing of the comments for a specific task.
     *
     * @param  \App\Models\Task  $task
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Task $task): JsonResponse
    {
        $comments = $task->comments()->with('user:id,name')->latest()->paginate(20);

        return response()->json($comments);
    }

    /**
     * Store a newly created comment for a specific task.
     *
     * @param  \Illuminate\Http\Request  $request // Replace with your FormRequest (e.g., StoreCommentRequest $request)
     * @param  \App\Models\Task  $task            // Task model injected via route model binding
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, Task $task): JsonResponse 
    {
        Log::info('[Comment Notify Debug] CommentController@store entered for Task ID: ' . $task->id);
        $validatedData = $request->validate([
            'body' => 'required|string|max:5000', 
        ]);
        $user = Auth::user(); 

        Log::info('[Comment Notify Debug] Attempting to create comment for Task ID: ' . $task->id . ' by User ID: ' . $user->id);

        try {
           
            $comment = $task->comments()->create([
                'body' => $validatedData['body'],
                'user_id' => $user->id, 
            ]);

            Log::info('[Comment Notify Debug] --- CommentController@store SUCCESS --- Created Comment ID: ' . $comment->id . ' for Task ID: ' . $task->id);

            Log::info('[Comment Notify Debug] Controller attempting dispatch CommentAddedToTask. Comment ID: ' . $comment->id . ', User ID: ' . $user->id);

            event(new CommentAddedToTask($comment, $user));

            $comment->load('user:id,name');

            return response()->json([
                'message' => 'Comment added successfully.',
                'comment' => $comment
            ], 201); 

        } catch (\Exception $e) {
          
            Log::error('[Comment Notify Debug] Failed to create comment or dispatch event for Task ID: ' . $task->id . '. Error: ' . $e->getMessage(), [
                'exception' => $e
            ]);

            return response()->json(['message' => 'Failed to add comment due to a server error.'], 500);
        }
    }
}