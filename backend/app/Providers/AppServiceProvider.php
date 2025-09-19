<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\EncryptionService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(EncryptionService::class, function ($app) {
            return new EncryptionService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //1
    }
}