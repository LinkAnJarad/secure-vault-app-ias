<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SetupApplication extends Command
{
    protected $signature = 'app:setup';
    protected $description = 'Setup the application after installation';

    public function handle()
    {
        $this->info('Setting up Secure File Vault...');

        // Check database connection
        try {
            DB::connection()->getPdo();
            $this->info('✓ Database connection successful');
        } catch (\Exception $e) {
            $this->error('✗ Database connection failed: ' . $e->getMessage());
            return 1;
        }

        // Run migrations
        $this->info('Running migrations...');
        $this->call('migrate', ['--force' => true]);

        // Create storage directories
        $this->info('Creating storage directories...');
        $storagePaths = [
            storage_path('app/files'),
            storage_path('app/temp'),
            storage_path('logs'),
        ];

        foreach ($storagePaths as $path) {
            if (!file_exists($path)) {
                mkdir($path, 0755, true);
                $this->info("✓ Created directory: $path");
            }
        }

        $this->info('Application setup completed successfully!');
        return 0;
    }
}