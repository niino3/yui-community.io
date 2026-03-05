<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// API health（web 経由で確実に JSON を返す）
Route::get('/api/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'yui-backend',
        'timestamp' => now()->toIso8601String(),
    ]);
});
