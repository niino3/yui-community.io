<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipment';

    protected $fillable = [
        'community_id',
        'name',
        'description',
        'qr_code',
        'daily_rate_token',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate_token' => 'decimal:8',
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(EquipmentReservation::class);
    }
}
