<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionRecordController extends Controller
{
    /**
     * フロントエンドからオンチェーン送金完了後に呼ばれる。
     * Transfer イベントを DB に記録する。
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'to_address' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{40}$/'],
            'amount' => ['required', 'numeric', 'min:0'],
            'tx_hash' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{64}$/'],
        ]);

        $fromUser = $request->user();
        $toAddress = strtolower($request->input('to_address'));
        $amount = $request->input('amount');
        $txHash = $request->input('tx_hash');

        $community = Community::first();
        if (! $community) {
            return response()->json(['message' => 'コミュニティが設定されていません'], 500);
        }

        $toUser = User::firstOrCreate(
            ['wallet_address' => $toAddress],
            ['display_name' => substr($toAddress, 0, 6) . '...' . substr($toAddress, -4)],
        );

        $exists = Transaction::where('tx_hash', $txHash)->exists();
        if ($exists) {
            return response()->json(['message' => 'Already recorded'], 200);
        }

        Transaction::create([
            'community_id' => $community->id,
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'amount' => $amount,
            'tx_type' => 'transfer',
            'tx_hash' => $txHash,
            'status' => 'confirmed',
        ]);

        return response()->json(['message' => 'Recorded'], 201);
    }
}
