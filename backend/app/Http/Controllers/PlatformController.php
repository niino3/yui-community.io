<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PlatformController extends Controller
{
    /**
     * 全コミュニティ一覧を取得（プラットフォーム管理者向け）
     */
    public function index()
    {
        $communities = Community::with(['creator', 'members'])
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($communities);
    }

    /**
     * コミュニティを作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:communities,slug|alpha_dash',
            'token_name' => 'required|string|max:255',
            'token_symbol' => 'required|string|max:10',
            'contract_address' => 'nullable|string|size:42',
            'sbt_contract_address' => 'nullable|string|size:42',
            'demurrage_rate' => 'nullable|numeric|min:0|max:1',
            'logo_url' => 'nullable|url',
            'color_primary' => 'nullable|string|size:7',
            'color_secondary' => 'nullable|string|size:7',
            'locale' => 'nullable|string|max:5',
            'token_rate_description' => 'nullable|string',
            'max_members' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $community = Community::create(array_merge(
            $validator->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json($community, 201);
    }

    /**
     * コミュニティ詳細を取得
     */
    public function show(string $id)
    {
        $community = Community::with(['creator', 'members', 'contracts'])
            ->withCount('members')
            ->findOrFail($id);

        return response()->json($community);
    }

    /**
     * コミュニティを更新
     */
    public function update(Request $request, string $id)
    {
        $community = Community::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|alpha_dash|unique:communities,slug,' . $id,
            'token_name' => 'sometimes|required|string|max:255',
            'token_symbol' => 'sometimes|required|string|max:10',
            'contract_address' => 'nullable|string|size:42',
            'sbt_contract_address' => 'nullable|string|size:42',
            'demurrage_rate' => 'nullable|numeric|min:0|max:1',
            'is_active' => 'nullable|boolean',
            'logo_url' => 'nullable|url',
            'color_primary' => 'nullable|string|size:7',
            'color_secondary' => 'nullable|string|size:7',
            'locale' => 'nullable|string|max:5',
            'token_rate_description' => 'nullable|string',
            'max_members' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $community->update($validator->validated());

        return response()->json($community);
    }

    /**
     * コミュニティを無効化（論理削除）
     */
    public function destroy(string $id)
    {
        $community = Community::findOrFail($id);
        $community->update(['is_active' => false]);

        return response()->json([
            'message' => 'コミュニティを無効化しました',
        ]);
    }

    /**
     * プラットフォーム統計を取得
     */
    public function stats()
    {
        $totalCommunities = Community::count();
        $activeCommunities = Community::where('is_active', true)->count();
        $totalMembers = \DB::table('community_members')
            ->where('status', 'active')
            ->distinct('user_id')
            ->count();
        $totalTransactions = \DB::table('transactions')->count();

        return response()->json([
            'total_communities' => $totalCommunities,
            'active_communities' => $activeCommunities,
            'total_members' => $totalMembers,
            'total_transactions' => $totalTransactions,
        ]);
    }
}
