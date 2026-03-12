<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    /**
     * 現在のコミュニティ情報を取得
     * ResolveTenant ミドルウェアで解決されたコミュニティを返す
     */
    public function current(Request $request)
    {
        // ResolveTenant ミドルウェアによって解決されたコミュニティ
        $community = app('current_community');

        if (!$community) {
            return response()->json([
                'message' => 'コミュニティが特定できません',
            ], 400);
        }

        return response()->json($community);
    }

    /**
     * 全コミュニティ一覧を取得（公開情報のみ）
     */
    public function index()
    {
        $communities = \App\Models\Community::where('is_active', true)
            ->select([
                'id',
                'name',
                'slug',
                'token_name',
                'token_symbol',
                'contract_address',
                'sbt_contract_address',
                'logo_url',
                'color_primary',
                'color_secondary',
                'locale',
                'token_rate_description',
            ])
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($communities);
    }
}
