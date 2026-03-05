<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['requester:id,wallet_address,display_name,avatar_url', 'worker:id,wallet_address,display_name,avatar_url']);

        if ($request->has('community_id')) {
            $query->where('community_id', $request->input('community_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        $tasks = $query->latest()->paginate(20);

        return response()->json($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = Task::create([
            ...$request->validated(),
            'requester_id' => $request->user()->id,
            'status' => 'open',
        ]);

        $task->load('requester:id,wallet_address,display_name,avatar_url');

        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        $task->load([
            'requester:id,wallet_address,display_name,avatar_url',
            'worker:id,wallet_address,display_name,avatar_url',
            'community:id,name,slug,token_symbol',
        ]);

        return response()->json($task);
    }

    /**
     * Worker applies to an open task.
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        if ($task->status !== 'open') {
            return response()->json(['message' => 'このタスクには応募できません'], 422);
        }

        if ($task->requester_id === $request->user()->id) {
            return response()->json(['message' => '自分のタスクには応募できません'], 422);
        }

        $task->update([
            'worker_id' => $request->user()->id,
            'status' => 'assigned',
            'started_at' => now(),
        ]);

        $task->load('worker:id,wallet_address,display_name,avatar_url');

        return response()->json($task);
    }

    /**
     * Worker reports task completion.
     */
    public function complete(Request $request, Task $task): JsonResponse
    {
        if ($task->status !== 'assigned' && $task->status !== 'in_progress') {
            return response()->json(['message' => 'このタスクは完了報告できません'], 422);
        }

        if ($task->worker_id !== $request->user()->id) {
            return response()->json(['message' => '担当者のみ完了報告できます'], 403);
        }

        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json($task);
    }

    /**
     * Requester approves the completed task (triggers token transfer).
     */
    public function approve(Request $request, Task $task): JsonResponse
    {
        if ($task->status !== 'completed') {
            return response()->json(['message' => '完了済みタスクのみ承認できます'], 422);
        }

        if ($task->requester_id !== $request->user()->id) {
            return response()->json(['message' => '依頼者のみ承認できます'], 403);
        }

        $task->update(['status' => 'approved']);

        // TODO: M2-5 でトランザクション記録 + オンチェーン送金トリガーを実装
        if ($task->worker_id && $task->token_reward > 0) {
            $task->community->transactions()->create([
                'from_user_id' => $task->requester_id,
                'to_user_id' => $task->worker_id,
                'amount' => $task->token_reward,
                'tx_type' => 'transfer',
                'status' => 'pending',
            ]);
        }

        return response()->json($task);
    }
}
