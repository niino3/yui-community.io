<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\EarthCareController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransactionRecordController;
use App\Http\Controllers\PlatformController;
use Illuminate\Support\Facades\Route;

// 公開エンドポイント
Route::get('/communities', [CommunityController::class, 'index']);
Route::get('/communities/current', [CommunityController::class, 'current']);

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

// プラットフォーム管理API（本番では認証+admin権限を追加すること）
Route::prefix('platform')->group(function () {
    Route::get('/communities', [PlatformController::class, 'index']);
    Route::post('/communities', [PlatformController::class, 'store']);
    Route::get('/communities/{id}', [PlatformController::class, 'show']);
    Route::patch('/communities/{id}', [PlatformController::class, 'update']);
    Route::delete('/communities/{id}', [PlatformController::class, 'destroy']);
    Route::get('/stats', [PlatformController::class, 'stats']);
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
    Route::post('/transactions/record', [TransactionRecordController::class, 'store']);

    Route::get('/equipment', [EquipmentController::class, 'index']);
    Route::get('/equipment/{equipment}', [EquipmentController::class, 'show']);
    Route::post('/equipment/{equipment}/reserve', [EquipmentController::class, 'reserve']);
    Route::patch('/equipment/{equipment}/return', [EquipmentController::class, 'returnEquipment']);

    Route::get('/earth-care', [EarthCareController::class, 'index']);
    Route::post('/earth-care', [EarthCareController::class, 'store']);
    Route::get('/earth-care/{earthCare}', [EarthCareController::class, 'show']);
    Route::post('/earth-care/{earthCare}/approve', [EarthCareController::class, 'approve']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
