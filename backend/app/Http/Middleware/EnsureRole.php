<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  許可されるロール（'member', 'operator', 'admin'）
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => '認証が必要です',
            ], 401);
        }

        $community = app('current_community');

        if (! $community) {
            return response()->json([
                'message' => 'コミュニティが特定できません',
            ], 400);
        }

        // ユーザーのコミュニティメンバーシップとロールを取得
        $membership = DB::table('community_members')
            ->where('community_id', $community->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json([
                'message' => 'このコミュニティのメンバーではありません',
            ], 403);
        }

        // ロールが指定されたロールのいずれかと一致するかチェック
        if (! in_array($membership->role, $roles)) {
            return response()->json([
                'message' => '権限がありません',
            ], 403);
        }

        // リクエストにロール情報を追加
        $request->merge(['user_role' => $membership->role]);

        return $next($request);
    }
}
