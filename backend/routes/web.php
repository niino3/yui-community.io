<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// /api/health は api.php で定義（web ミドルウェア＝Redis セッションを避ける）
