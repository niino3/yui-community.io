<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Equipment::with('community:id,name,slug,token_symbol');

        if ($request->has('community_id')) {
            $query->where('community_id', $request->input('community_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $equipment = $query->latest()->paginate(20);

        return response()->json($equipment);
    }

    public function show(Equipment $equipment): JsonResponse
    {
        $equipment->load([
            'community:id,name,slug,token_symbol',
            'reservations' => fn ($q) => $q->where('status', '!=', 'cancelled')
                ->with('user:id,wallet_address,display_name')
                ->latest()
                ->limit(10),
        ]);

        return response()->json($equipment);
    }

    public function reserve(Request $request, Equipment $equipment): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        if ($equipment->status !== 'available') {
            return response()->json(['message' => 'この農機具は現在予約できません'], 422);
        }

        $days = max(1, now()->parse($request->start_date)->diffInDays(now()->parse($request->end_date)) + 1);
        $tokenAmount = $equipment->daily_rate_token * $days;

        $reservation = EquipmentReservation::create([
            'equipment_id' => $equipment->id,
            'user_id' => $request->user()->id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'token_amount' => $tokenAmount,
            'status' => 'reserved',
        ]);

        $equipment->update(['status' => 'in_use']);

        $reservation->load('user:id,wallet_address,display_name');

        return response()->json($reservation, 201);
    }

    public function returnEquipment(Request $request, Equipment $equipment): JsonResponse
    {
        $reservation = $equipment->reservations()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['reserved', 'active'])
            ->latest()
            ->first();

        if (! $reservation) {
            return response()->json(['message' => '有効な予約が見つかりません'], 404);
        }

        $reservation->update(['status' => 'returned']);

        $hasOtherActive = $equipment->reservations()
            ->whereIn('status', ['reserved', 'active'])
            ->exists();

        if (! $hasOtherActive) {
            $equipment->update(['status' => 'available']);
        }

        return response()->json($reservation);
    }
}
