<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class EncryptionService
{
    public function generateRSAKeyPair(): array
    {
        $config = [
            "digest_alg" => "sha512",
            "private_key_bits" => 2048,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];

        $resource = openssl_pkey_new($config);
        openssl_pkey_export($resource, $privateKey);
        $publicKey = openssl_pkey_get_details($resource)['key'];

        return [
            'private_key' => $privateKey,
            'public_key' => $publicKey
        ];
    }

    public function generateAESKey(): string
    {
        return random_bytes(32); // 256-bit key
    }

    public function encryptWithRSA(string $data, string $publicKey): string
    {
        openssl_public_encrypt($data, $encrypted, $publicKey);
        return base64_encode($encrypted);
    }

    public function decryptWithRSA(string $encryptedData, string $privateKey): string
    {
        $encrypted = base64_decode($encryptedData);
        openssl_private_decrypt($encrypted, $decrypted, $privateKey);
        return $decrypted;
    }

    public function encryptFile(string $filePath, string $key): string
    {
        $data = file_get_contents($filePath);
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    public function decryptFile(string $encryptedData, string $key): string
    {
        $data = base64_decode($encryptedData);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }

    public function calculateFileHash(string $filePath): string
    {
        return hash_file('sha256', $filePath);
    }
}