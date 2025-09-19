<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Add custom middleware alias
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'force.json' => \App\Http\Middleware\ForceJsonResponse::class,
        ]);
        
        // API middleware group - ensure JSON responses
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);
        
        // Throttle settings
        $middleware->throttleApi('1000,1'); // 1000 requests per minute
        
        // Trust all proxies (adjust for production)
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Force JSON responses for API routes
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => 'Server Error',
                    'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
                    'trace' => config('app.debug') ? $e->getTraceAsString() : null
                ], 500);
            }
        });
    })->create();