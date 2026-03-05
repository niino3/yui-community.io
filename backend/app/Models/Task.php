<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_id',
        'requester_id',
        'worker_id',
        'title',
        'description',
        'category',
        'token_reward',
        'status',
        'location_lat',
        'location_lng',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'token_reward' => 'decimal:8',
            'location_lat' => 'decimal:7',
            'location_lng' => 'decimal:7',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'worker_id');
    }
}
