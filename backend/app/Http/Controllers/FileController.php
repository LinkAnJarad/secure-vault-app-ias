<?php

namespace App\Http\Controllers;

use App\Models\User; 
use App\Models\File;
use App\Models\AuditLog;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FileController extends Controller
{
    protected $encryptionService;
    protected $allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    // public function upload(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'file' => 'required|file|max:10240', // 10MB max
    //         'labels' => 'array',
    //         'labels.*' => 'string|max:255'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json(['errors' => $validator->errors()], 422);
    //     }

    //     $uploadedFile = $request->file('file');
    //     $mimeType = $uploadedFile->getMimeType();

    //     if (!in_array($mimeType, $this->allowedMimes)) {
    //         return response()->json(['error' => 'File type not allowed'], 422);
    //     }

    //     $user = $request->user();
    //     $originalName = $uploadedFile->getClientOriginalName();
    //     $fileName = Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
    //     $tempPath = $uploadedFile->storeAs('temp', $fileName);

    //     // Generate AES key and encrypt file
    //     $aesKey = $this->encryptionService->generateAESKey();
    //     $encryptedContent = $this->encryptionService->encryptFile(
    //         Storage::path($tempPath),
    //         $aesKey
    //     );

    //     // Encrypt AES key with user's RSA public key
    //     $encryptedKey = $this->encryptionService->encryptWithRSA(
    //         $aesKey,
    //         $user->rsa_public_key
    //     );

    //     // Calculate hash before encryption for integrity
    //     $fileHash = $this->encryptionService->calculateFileHash(Storage::path($tempPath));

    //     // Store encrypted file
    //     $finalPath = 'files/' . $fileName;
    //     Storage::put($finalPath, base64_decode($encryptedContent));

    //     // Clean up temp file
    //     Storage::delete($tempPath);

    //     // Extract text for search (if text file)
    //     $extractedText = '';
    //     if ($mimeType === 'text/plain') {
    //         $extractedText = substr(file_get_contents($uploadedFile->getRealPath()), 0, 1000);
    //     }

    //     $file = File::create([
    //         'name' => $fileName,
    //         'original_name' => $originalName,
    //         'path' => $finalPath,
    //         'size' => $uploadedFile->getSize(),
    //         'mime_type' => $mimeType,
    //         'hash' => $fileHash,
    //         'encrypted_key' => $encryptedKey,
    //         'owner_id' => $user->id,
    //         'department' => $user->department,
    //         'labels' => $request->labels ?? [],
    //         'extracted_text' => $extractedText
    //     ]);

    //     AuditLog::create([
    //         'user_id' => $user->id,
    //         'action' => 'upload',
    //         'file_id' => $file->id,
    //         'ip_address' => $request->ip(),
    //         'details' => ['filename' => $originalName, 'size' => $uploadedFile->getSize()]
    //     ]);

    //     return response()->json($file->load('owner'), 201);
    // }


    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:1000', // 10MB max
            'labels' => 'array',
            'labels.*' => 'string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $uploadedFile = $request->file('file');
        $mimeType = $uploadedFile->getMimeType();

        if (!in_array($mimeType, $this->allowedMimes)) {
            return response()->json(['error' => 'File type not allowed'], 422);
        }

        try {
            $user = $request->user();
            $originalName = $uploadedFile->getClientOriginalName();
            $fileName = Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
            $tempPath = $uploadedFile->storeAs('temp', $fileName);

            // Generate AES key and encrypt file
            $aesKey = $this->encryptionService->generateAESKey();
            $encryptedContent = $this->encryptionService->encryptFile(
                Storage::path($tempPath),
                $aesKey
            );

            // Encrypt AES key with user's RSA public key
            $encryptedKey = $this->encryptionService->encryptWithRSA(
                $aesKey,
                $user->rsa_public_key
            );

            // Calculate hash before encryption for integrity
            $fileHash = $this->encryptionService->calculateFileHash(Storage::path($tempPath));

            // Store encrypted file
            $finalPath = 'files/' . $fileName;
            Storage::put($finalPath, base64_decode($encryptedContent));

            // Clean up temp file
            Storage::delete($tempPath);

            // Extract text for search (if text file)
            $extractedText = '';
            if ($mimeType === 'text/plain') {
                $extractedText = substr(file_get_contents($uploadedFile->getRealPath()), 0, 1000);
            }

            $file = File::create([
                'name' => $fileName,
                'original_name' => $originalName,
                'path' => $finalPath,
                'size' => $uploadedFile->getSize(),
                'mime_type' => $mimeType,
                'hash' => $fileHash,
                'encrypted_key' => $encryptedKey,
                'owner_id' => $user->id,
                'department' => $user->department,
                'labels' => $request->labels ?? [],
                'extracted_text' => $extractedText
            ]);

            // Auto-share with all admins (with error handling)
            $this->shareFileWithAdmins($file, $aesKey);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'upload',
                'file_id' => $file->id,
                'ip_address' => $request->ip(),
                'details' => ['filename' => $originalName, 'size' => $uploadedFile->getSize()]
            ]);

            return response()->json($file->load('owner'), 201);
            
        } catch (\Exception $e) {
            // Clean up any created files if upload fails
            if (isset($finalPath)) {
                Storage::delete($finalPath);
            }
            if (isset($tempPath)) {
                Storage::delete($tempPath);
            }
            if (isset($file)) {
                $file->delete();
            }
            
            AuditLog::create([
                'user_id' => $user->id ?? null,
                'action' => 'upload_failed',
                'file_id' => $file->id ?? null,
                'ip_address' => $request->ip(),
                'details' => ['error' => $e->getMessage()]
            ]);

            return response()->json(['error' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    private function shareFileWithAdmins(File $file, string $aesKey)
    {
        try {
            // Get all admins
            $admins = User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                // Skip admins without RSA keys
                if (empty($admin->rsa_public_key)) {
                    continue;
                }
                
                try {
                    // Encrypt AES key with admin's RSA public key
                    $encryptedKeyForAdmin = $this->encryptionService->encryptWithRSA(
                        $aesKey,
                        $admin->rsa_public_key
                    );

                    // Share the file with the admin
                    $file->sharedUsers()->syncWithoutDetaching([
                        $admin->id => ['encrypted_key' => $encryptedKeyForAdmin]
                    ]);
                } catch (\Exception $e) {
                    // Log the error but don't stop the upload process
                    \Log::warning('Failed to share file with admin', [
                        'file_id' => $file->id,
                        'admin_id' => $admin->id,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
            }
        } catch (\Exception $e) {
            // Log the error but don't stop the upload process
            \Log::warning('Failed to share file with admins', [
                'file_id' => $file->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = File::with('owner');

        if ($user->isAdmin()) {
            // Admin sees everything
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id); // Own files

                if ($user->isStaff()) {
                    $q->orWhere('department', $user->department); // Department files
                }

                // Always include files shared directly with this user
                $q->orWhereHas('sharedUsers', function ($sq) use ($user) {
                    $sq->where('user_id', $user->id);
                });
            });
        }

        // Search...
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'like', "%{$search}%")
                ->orWhere('extracted_text', 'like', "%{$search}%")
                ->orWhereJsonContains('labels', $search)
                ->orWhereHas('owner', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        $files = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($files);
    }

    public function download(Request $request, File $file)
    {
        $user = $request->user();

        if (!$user->canAccessFile($file)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            // Get encrypted AES key for this user
            $encryptedKey = $file->encrypted_key;
            
            // If file is shared, get the user-specific encrypted key
            if ($file->owner_id !== $user->id) {
                $share = $file->sharedUsers()->where('user_id', $user->id)->first();
                if ($share) {
                    $encryptedKey = $share->pivot->encrypted_key;
                }
            }

            // Decrypt AES key with user's RSA private key
            $aesKey = $this->encryptionService->decryptWithRSA(
                $encryptedKey,
                $user->rsa_private_key
            );

            // Decrypt file content
            $encryptedContent = Storage::get($file->path);
            $decryptedContent = $this->encryptionService->decryptFile(
                base64_encode($encryptedContent),
                $aesKey
            );

            // Verify file integrity
            $tempPath = storage_path('app/temp/verify_' . $file->name);
            file_put_contents($tempPath, $decryptedContent);
            $currentHash = $this->encryptionService->calculateFileHash($tempPath);
            unlink($tempPath);

            if ($currentHash !== $file->hash) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'integrity_check_failed',
                    'file_id' => $file->id,
                    'ip_address' => $request->ip(),
                    'details' => ['expected_hash' => $file->hash, 'actual_hash' => $currentHash]
                ]);

                return response()->json(['error' => 'File integrity check failed'], 500);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'download',
                'file_id' => $file->id,
                'ip_address' => $request->ip()
            ]);

            return response($decryptedContent, 200, [
                'Content-Type' => $file->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $file->original_name . '"',
                'Content-Length' => strlen($decryptedContent)
            ]);

        } catch (\Exception $e) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'download_failed',
                'file_id' => $file->id,
                'ip_address' => $request->ip(),
                'details' => ['error' => $e->getMessage()]
            ]);

            return response()->json(['error' => 'Failed to decrypt file'], 500);
        }
    }

    public function delete(Request $request, File $file)
    {
        $user = $request->user();

        if (!$user->isAdmin() && $file->owner_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Storage::delete($file->path);
        
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'delete',
            'file_id' => $file->id,
            'ip_address' => $request->ip(),
            'details' => ['filename' => $file->original_name]
        ]);

        $file->delete();

        return response()->json(['message' => 'File deleted successfully']);
    }

    public function share(Request $request, File $file)
    {
        $user = $request->user();

        if (!$user->canAccessFile($file)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Decrypt the original AES key
        $aesKey = $this->encryptionService->decryptWithRSA(
            $file->encrypted_key,
            $user->rsa_private_key
        );

        foreach ($request->user_ids as $userId) {
            $targetUser = User::find($userId);
            
            // Encrypt AES key with target user's public key
            $encryptedKeyForUser = $this->encryptionService->encryptWithRSA(
                $aesKey,
                $targetUser->rsa_public_key
            );

            $file->sharedUsers()->syncWithoutDetaching([
                $userId => ['encrypted_key' => $encryptedKeyForUser]
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'share',
                'file_id' => $file->id,
                'ip_address' => $request->ip(),
                'details' => ['shared_with_user_id' => $userId, 'shared_with_email' => $targetUser->email]
            ]);
        }

        return response()->json(['message' => 'File shared successfully']);
    }
}