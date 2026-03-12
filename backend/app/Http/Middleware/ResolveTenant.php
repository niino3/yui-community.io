<?php

namespace App\Http\Middleware;

use App\Models\Community;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolveSlug($request);

        if (! $slug) {
            return response()->json([
                'message' => 'コミュニティが特定できません',
            ], 400);
        }

        $community = Community::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $community) {
            return response()->json([
                'message' => 'コミュニティが見つかりません',
            ], 404);
        }

        // アプリケーション全体でコミュニティを利用可能にする
        app()->instance('current_community', $community);
        $request->merge(['community_id' => $community->id]);

        return $next($request);
    }

    /**
     * リクエストからコミュニティスラグを解決する
     *
     * 優先順位:
     * 1. X-Community-Slug ヘッダー
     * 2. サブドメイン（例: hokkaido.yui-community.io → hokkaido）
     * 3. クエリパラメータ ?community=hokkaido
     */
    private function resolveSlug(Request $request): ?string
    {
        // 1. ヘッダーから取得
        if ($request->hasHeader('X-Community-Slug')) {
            return $request->header('X-Community-Slug');
        }

        // 2. サブドメインから取得
        $host = $request->getHost();
        $parts = explode('.', $host);

        // サブドメインがある場合（例: hokkaido.yui-community.io）
        if (count($parts) >= 3 && ! in_array($parts[0], ['www', 'api', 'admin'])) {
            return $parts[0];
        }

        // 3. クエリパラメータから取得
        if ($request->has('community')) {
            return $request->query('community');
        }

        return null;
    }
}
