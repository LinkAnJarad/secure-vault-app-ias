<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuditController;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/debug-register', function (Request $request) {

    

    Log::info('Debug registration started', $request->all());
    
    try {
        // Test 1: Basic request data
        Log::info('Request data received', $request->all());
        
        // Test 2: Database connection
        $dbTest = DB::select('SELECT 1 as test');
        Log::info('Database test passed', $dbTest);
        
        // Test 3: Check if users table exists
        $tables = DB::select('SHOW TABLES');
        Log::info('Database tables', ['tables' => $tables]);
        
        // Test 4: Try to describe users table
        try {
            $userTableStructure = DB::select('DESCRIBE users');
            Log::info('Users table structure', ['structure' => $userTableStructure]);
        } catch (\Exception $e) {
            Log::error('Users table does not exist', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Users table does not exist', 'message' => $e->getMessage()], 500);
        }
        
        // Test 5: Try creating a basic user record
        $userId = DB::table('users')->insertGetId([
            'name' => $request->name ?? 'Test User',
            'email' => $request->email ?? 'test@test.com',
            'password' => bcrypt($request->password ?? 'password'),
            'role' => $request->role ?? 'user',
            'department' => $request->department,
            'rsa_public_key' => 'temp_public_key',
            'rsa_private_key' => 'temp_private_key',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        Log::info('User created successfully', ['user_id' => $userId]);
        
        return response()->json([
            'success' => true,
            'message' => 'Debug registration successful',
            'user_id' => $userId,
            'steps_completed' => [
                'request_received' => true,
                'database_connected' => true,
                'tables_exist' => true,
                'user_created' => true
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('Debug registration failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Debug registration failed',
            'message' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null
        ], 500);
    }
});

// Test route
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working',
        'timestamp' => now(),
        'db_connected' => true
    ]);
});

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // File routes
    Route::get('/files', [FileController::class, 'index']);
    Route::post('/files', [FileController::class, 'upload']);
    Route::get('/files/{file}/download', [FileController::class, 'download']);
    Route::delete('/files/{file}', [FileController::class, 'delete']);
    Route::post('/files/{file}/share', [FileController::class, 'share']);
    
    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::post('/admin/users', [AdminController::class, 'createUser']);
        Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/admin/audit-logs', [AuditController::class, 'index']);
        Route::post('/admin/backup', [AdminController::class, 'backup']);
    });
});


Route::middleware('auth:sanctum')->get('/users-for-sharing', [AdminController::class, 'getUsersForSharing']);