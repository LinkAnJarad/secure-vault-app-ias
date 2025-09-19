<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    const ROLE_ADMIN = 'admin';
    const ROLE_STAFF = 'staff';
    const ROLE_USER = 'user';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'rsa_public_key',
        'rsa_private_key',
        'department'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'rsa_private_key'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function files(): HasMany
    {
        return $this->hasMany(File::class, 'owner_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    public function canAccessFile(File $file): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if ($file->owner_id === $this->id) {
            return true;
        }

        if ($this->isStaff() && $file->department === $this->department) {
            return true;
        }

        return $file->sharedUsers()->where('user_id', $this->id)->exists();
    }
}