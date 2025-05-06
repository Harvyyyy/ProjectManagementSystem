<?php

namespace App\Events;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentAddedToTask
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Comment $comment;
    public User $user; // The user who added the comment

    /**
     * Create a new event instance.
     *
     * @param Comment $comment The comment that was added.
     * @param User $user The user who added the comment.
     */
    public function __construct(Comment $comment, User $user)
    {
        $this->comment = $comment;
        $this->user = $user;
        // Note: The listener can access the associated task via $comment->task
        // if the relationship is set up correctly in the Comment model.
    }
}