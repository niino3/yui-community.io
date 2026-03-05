<?php

namespace App\Services;

use Elliptic\EC;
use kornrunner\Keccak;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class EthereumService
{
    private const NONCE_TTL_MINUTES = 5;

    public function generateNonce(string $walletAddress): string
    {
        $nonce = Str::random(32);
        $key = $this->nonceCacheKey($walletAddress);
        Cache::put($key, $nonce, now()->addMinutes(self::NONCE_TTL_MINUTES));

        return $nonce;
    }

    public function buildSiweMessage(string $walletAddress, string $nonce): string
    {
        $domain = parse_url(config('app.url'), PHP_URL_HOST) ?? 'localhost';
        $uri = config('app.url');
        $issuedAt = now()->toIso8601String();

        return implode("\n", [
            "{$domain} wants you to sign in with your Ethereum account:",
            $walletAddress,
            '',
            'Sign in to Yui Community',
            '',
            "URI: {$uri}",
            'Version: 1',
            "Chain ID: 137",
            "Nonce: {$nonce}",
            "Issued At: {$issuedAt}",
        ]);
    }

    public function verifySignature(string $walletAddress, string $message, string $signature): bool
    {
        $nonce = $this->extractNonce($message);
        if (! $nonce || ! $this->verifyNonce($walletAddress, $nonce)) {
            return false;
        }

        $recovered = $this->recoverAddress($message, $signature);
        if (! $recovered) {
            return false;
        }

        $this->consumeNonce($walletAddress);

        return strtolower($recovered) === strtolower($walletAddress);
    }

    private function recoverAddress(string $message, string $signature): ?string
    {
        try {
            $signature = $this->stripHexPrefix($signature);
            if (strlen($signature) !== 130) {
                return null;
            }

            $r = substr($signature, 0, 64);
            $s = substr($signature, 64, 64);
            $v = hexdec(substr($signature, 128, 2));

            if ($v >= 27) {
                $v -= 27;
            }

            $prefix = "\x19Ethereum Signed Message:\n" . strlen($message);
            $hash = Keccak::hash($prefix . $message, 256);

            $ec = new EC('secp256k1');
            $publicKey = $ec->recoverPubKey($hash, ['r' => $r, 's' => $s], $v);
            $pubKeyHex = $publicKey->encode('hex');

            return $this->pubKeyToAddress($pubKeyHex);
        } catch (\Exception) {
            return null;
        }
    }

    private function pubKeyToAddress(string $pubKeyHex): string
    {
        $pubKeyHex = ltrim($pubKeyHex, '0x');
        if (strlen($pubKeyHex) === 130) {
            $pubKeyHex = substr($pubKeyHex, 2);
        }

        $hash = Keccak::hash(hex2bin($pubKeyHex), 256);

        return '0x' . substr($hash, -40);
    }

    private function extractNonce(string $message): ?string
    {
        if (preg_match('/Nonce:\s*(\S+)/', $message, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function nonceCacheKey(string $walletAddress): string
    {
        return 'auth_nonce:' . strtolower($walletAddress);
    }

    private function verifyNonce(string $walletAddress, string $nonce): bool
    {
        $stored = Cache::get($this->nonceCacheKey($walletAddress));

        return $stored !== null && hash_equals($stored, $nonce);
    }

    private function consumeNonce(string $walletAddress): void
    {
        Cache::forget($this->nonceCacheKey($walletAddress));
    }

    private function stripHexPrefix(string $hex): string
    {
        return str_starts_with($hex, '0x') ? substr($hex, 2) : $hex;
    }
}
