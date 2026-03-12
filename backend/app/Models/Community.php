<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Community extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'token_name',
        'token_symbol',
        'contract_address',
        'sbt_contract_address',
        'demurrage_rate',
        'is_active',
        'logo_url',
        'color_primary',
        'color_secondary',
        'locale',
        'token_rate_description',
        'max_members',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'demurrage_rate' => 'decimal:4',
            'is_active' => 'boolean',
            'max_members' => 'integer',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_members')
            ->withPivot('membership_sbt_token_id', 'status', 'role', 'joined_at')
            ->withTimestamps();
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(ContractRegistry::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(Equipment::class);
    }

    public function earthCareActivities(): HasMany
    {
        return $this->hasMany(EarthCareActivity::class);
    }
}
