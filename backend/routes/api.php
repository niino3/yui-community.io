<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::get('/communities', function () {
    return response()->json(\App\Models\Community::select('id', 'name', 'slug', 'token_symbol', 'contract_address', 'sbt_contract_address')->get());
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'yui-backend',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/nonce', [AuthController::class, 'nonce']);
    Route::post('/wallet', [AuthController::class, 'wallet']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}/assign', [TaskController::class, 'assign']);
    Route::patch('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::patch('/tasks/{task}/approve', [TaskController::class, 'approve']);

    Route::get('/transactions', [TransactionController::class, 'index']);
});
