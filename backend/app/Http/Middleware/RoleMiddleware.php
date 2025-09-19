<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        if ($role === 'admin' && !$user->isAdmin()) {
            return response()->json(['error' => 'Forbidden - Admin access required'], 403);
        }
        
        if ($role === 'staff' && !in_array($user->role, ['admin', 'staff'])) {
            return response()->json(['error' => 'Forbidden - Staff access required'], 403);
        }
        
        return $next($request);
    }
}