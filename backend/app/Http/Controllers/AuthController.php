<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function register(Request $request)
    {

        

        try {
            Log::info('Registration attempt', ['email' => $request->email]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => ['required', 'confirmed', Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()],
                'role' => 'in:admin,staff,user',
                'department' => 'required_if:role,staff|string|max:255'
            ]);

            if ($validator->fails()) {
                Log::warning('Registration validation failed', ['errors' => $validator->errors()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            Log::info('Generating RSA key pair');
            $keyPair = $this->encryptionService->generateRSAKeyPair();

            Log::info('Creating user');
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? 'user',
                'department' => $request->department,
                'rsa_public_key' => $keyPair['public_key'],
                'rsa_private_key' => $keyPair['private_key']
            ]);

            Log::info('User created successfully', ['user_id' => $user->id]);

            $token = $user->createToken('auth_token')->plainTextToken;

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'register',
                'ip_address' => $request->ip(),
                'details' => ['email' => $user->email]
            ]);

            Log::info('Registration completed successfully', ['user_id' => $user->id]);

            return response()->json([
                'user' => $user->makeHidden(['rsa_private_key']),
                'token' => $token
            ], 201);

        } catch (\Exception $e) {
            Log::error('Registration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Registration failed',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred during registration'
            ], 500);
        }
    }

    // public function register(Request $request)
    // {
    //     try {
    //         Log::info('Testing minimal registration');

    //         $user = User::create([
    //             'name' => 'Test User',
    //             'email' => 'test@example.com',
    //             'password' => Hash::make('Password123!'),
    //             'role' => 'user',
    //             'department' => null,
    //             'rsa_public_key' => 'test_public',
    //             'rsa_private_key' => 'test_private'
    //         ]);

    //         return response()->json(['success' => true, 'user_id' => $user->id]);

    //     } catch (\Exception $e) {
    //         Log::error('Minimal registration failed', [
    //             'message' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString()
    //         ]);

    //         return response()->json(['error' => 'Registration failed'], 500);
    //     }
    // }

    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                AuditLog::create([
                    'user_id' => $user?->id,
                    'action' => 'login_failed',
                    'ip_address' => $request->ip(),
                    'details' => ['email' => $request->email]
                ]);

                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'user' => $user->makeHidden(['rsa_private_key']),
                'token' => $token
            ]);

        } catch (\Exception $e) {
            Log::error('Login failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Login failed',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred during login'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            $user->currentAccessToken()->delete();

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'ip_address' => $request->ip()
            ]);

            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            Log::error('Logout failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Logged out'], 200); // Return success anyway
        }
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->makeHidden(['rsa_private_key']));
    }
}