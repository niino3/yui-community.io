<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * 認証ユーザーの取引履歴一覧
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with([
            'fromUser:id,wallet_address,display_name',
            'toUser:id,wallet_address,display_name',
        ])
            ->where(function ($q) use ($request) {
                $q->where('from_user_id', $request->user()->id)
                    ->orWhere('to_user_id', $request->user()->id);
            });

        if ($request->has('community_id')) {
            $query->where('community_id', $request->input('community_id'));
        }

        $transactions = $query->latest()->paginate(20);

        return response()->json($transactions);
    }
}
