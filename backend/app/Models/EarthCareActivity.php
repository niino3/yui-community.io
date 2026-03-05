<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarthCareActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_id',
        'user_id',
        'activity_type',
        'description',
        'photo_hash',
        'gps_lat',
        'gps_lng',
        'approval_count',
        'status',
        'sbt_token_id',
    ];

    protected function casts(): array
    {
        return [
            'gps_lat' => 'decimal:7',
            'gps_lng' => 'decimal:7',
            'approval_count' => 'integer',
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
