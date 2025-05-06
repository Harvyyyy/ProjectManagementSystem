<?php

namespace App\Events;

use App\Models\Task;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskDeleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Note: When deleting, the full Task model might soon be inaccessible.
    // It's often better to pass specific data needed for the notification.
    // However, passing the model itself is fine if dispatched BEFORE deletion.
    public Task $task; // The task instance *before* it was deleted
    public User $user; // The user who deleted the task

    /**
     * Create a new event instance.
     *
     * @param Task $task The task instance being deleted.
     * @param User $user The user who initiated the deletion.
     */
    public function __construct(Task $task, User $user)
    {
        $this->task = $task; // Make sure this is dispatched *before* the actual delete operation
        $this->user = $user;
    }
}