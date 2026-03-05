<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'wallet_address',
        'display_name',
        'avatar_url',
        'email',
        'line_id',
        'role',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(Community::class, 'community_members')
            ->withPivot('membership_sbt_token_id', 'status', 'joined_at')
            ->withTimestamps();
    }

    public function requestedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'requester_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'worker_id');
    }

    public function sentTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'from_user_id');
    }

    public function receivedTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'to_user_id');
    }

    public function earthCareActivities(): HasMany
    {
        return $this->hasMany(EarthCareActivity::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOperator(): bool
    {
        return in_array($this->role, ['operator', 'admin']);
    }
}
