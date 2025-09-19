<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function users()
    {
        $users = User::select('id', 'name', 'email', 'role', 'department', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'role' => 'required|in:admin,staff,user',
            'department' => 'required_if:role,staff|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $keyPair = $this->encryptionService->generateRSAKeyPair();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'department' => $request->department,
            'rsa_public_key' => $keyPair['public_key'],
            'rsa_private_key' => $keyPair['private_key']
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_created',
            'ip_address' => $request->ip(),
            'details' => ['created_user_id' => $user->id, 'created_user_email' => $user->email]
        ]);

        return response()->json($user->makeHidden(['rsa_private_key']), 201);
    }

    public function updateUser(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'sometimes|required|in:admin,staff,user',
            'department' => 'sometimes|required_if:role,staff|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldData = $user->only(['name', 'email', 'role', 'department']);
        $user->update($request->only(['name', 'email', 'role', 'department']));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_updated',
            'ip_address' => $request->ip(),
            'details' => [
                'updated_user_id' => $user->id,
                'old_data' => $oldData,
                'new_data' => $user->only(['name', 'email', 'role', 'department'])
            ]
        ]);

        return response()->json($user->makeHidden(['rsa_private_key']));
    }

    public function deleteUser(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account'], 422);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_deleted',
            'ip_address' => $request->ip(),
            'details' => ['deleted_user_id' => $user->id, 'deleted_user_email' => $user->email]
        ]);

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function backup(Request $request)
    {
        // Trigger manual backup
        $exitCode = 0;
        $output = [];

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'manual_backup',
            'ip_address' => $request->ip(),
            'details' => [
                'exit_code' => $exitCode,
                'output' => implode("\n", $output)
            ]
        ]);
        
        \exec('/usr/local/bin/backup-script.sh 2>&1', $output, $exitCode); // ← Added backslash
        
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'manual_backup',
            'ip_address' => $request->ip(),
            'details' => ['exit_code' => $exitCode, 'output' => implode("\n", $output)]
        ]);

        if ($exitCode === 0) {
            return response()->json(['message' => 'Backup completed successfully']);
        } else {
            return response()->json(['error' => 'Backup failed'], 500);
        }
    }

    public function getUsersForSharing(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $users = User::select('id', 'name', 'email', 'role')->orderBy('name')->get();
        }
        elseif ($user->role === 'staff') {
            // $users = User::where('department', $user->department)
            //             ->orWhere('role', 'admin')
            //             ->select('id', 'name', 'email', 'role', 'department')
            //             ->orderBy('role')
            //             ->orderBy('name')
            //             ->get();
            $users = User::select('id', 'name', 'email', 'role')->orderBy('name')->get();

        }
        // Regular users shouldn't be here due to frontend guard, but just in case
        else {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => $users]);
    }
}