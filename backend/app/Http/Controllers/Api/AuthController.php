<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EthereumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly EthereumService $ethereum,
    ) {}

    /**
     * Step 1: Get a nonce + SIWE message for the wallet to sign.
     */
    public function nonce(Request $request): JsonResponse
    {
        $request->validate([
            'wallet_address' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{40}$/'],
        ]);

        $address = $request->input('wallet_address');
        $nonce = $this->ethereum->generateNonce($address);
        $message = $this->ethereum->buildSiweMessage($address, $nonce);

        return response()->json([
            'nonce' => $nonce,
            'message' => $message,
        ]);
    }

    /**
     * Step 2: Verify the signed message and issue an API token.
     */
    public function wallet(Request $request): JsonResponse
    {
        $request->validate([
            'wallet_address' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{40}$/'],
            'message' => ['required', 'string'],
            'signature' => ['required', 'string', 'regex:/^0x[a-fA-F0-9]{130}$/'],
        ]);

        $address = $request->input('wallet_address');
        $message = $request->input('message');
        $signature = $request->input('signature');

        if (! $this->ethereum->verifySignature($address, $message, $signature)) {
            return response()->json([
                'message' => 'Invalid signature',
            ], 401);
        }

        $user = User::firstOrCreate(
            ['wallet_address' => strtolower($address)],
            ['display_name' => $this->shortenAddress($address)],
        );

        $user->tokens()->where('name', 'wallet-auth')->delete();
        $token = $user->createToken('wallet-auth');

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => [
                'id' => $user->id,
                'wallet_address' => $user->wallet_address,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'wallet_address' => $user->wallet_address,
            'display_name' => $user->display_name,
            'avatar_url' => $user->avatar_url,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at->toIso8601String(),
        ]);
    }

    /**
     * Revoke the current token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function shortenAddress(string $address): string
    {
        return substr($address, 0, 6) . '...' . substr($address, -4);
    }
}
