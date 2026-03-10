<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\EarthCareActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarthCareController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EarthCareActivity::with('user:id,wallet_address,display_name,avatar_url');

        if ($request->has('community_id')) {
            $query->where('community_id', $request->input('community_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('activity_type')) {
            $query->where('activity_type', $request->input('activity_type'));
        }

        $activities = $query->latest()->paginate(20);

        return response()->json($activities);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'community_id' => ['required', 'exists:communities,id'],
            'activity_type' => ['required', 'in:composting,planting,pesticide_free,water_conservation'],
            'description' => ['nullable', 'string', 'max:2000'],
            'photo_hash' => ['nullable', 'string'],
            'gps_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'gps_lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $activity = EarthCareActivity::create([
            'community_id' => $request->community_id,
            'user_id' => $request->user()->id,
            'activity_type' => $request->activity_type,
            'description' => $request->description,
            'photo_hash' => $request->photo_hash,
            'gps_lat' => $request->gps_lat,
            'gps_lng' => $request->gps_lng,
            'status' => 'pending',
            'approval_count' => 0,
        ]);

        $activity->load('user:id,wallet_address,display_name,avatar_url');

        return response()->json($activity, 201);
    }

    public function show(EarthCareActivity $earthCare): JsonResponse
    {
        $earthCare->load([
            'user:id,wallet_address,display_name,avatar_url',
            'community:id,name,slug,token_symbol',
        ]);

        return response()->json($earthCare);
    }

    /**
     * 承認投票: 他のメンバーが活動を承認する。
     * 3票以上で自動的に approved になる。
     */
    public function approve(Request $request, EarthCareActivity $earthCare): JsonResponse
    {
        if ($earthCare->status !== 'pending') {
            return response()->json(['message' => '承認待ちの活動のみ投票できます'], 422);
        }

        if ($earthCare->user_id === $request->user()->id) {
            return response()->json(['message' => '自分の活動には投票できません'], 422);
        }

        $earthCare->increment('approval_count');

        $threshold = 3;
        if ($earthCare->approval_count >= $threshold) {
            $earthCare->update(['status' => 'approved']);
        }

        return response()->json($earthCare->fresh());
    }
}
