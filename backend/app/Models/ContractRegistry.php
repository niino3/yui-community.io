<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractRegistry extends Model
{
    use HasFactory;

    protected $table = 'contract_registry';

    protected $fillable = [
        'community_id',
        'contract_type',
        'address',
        'deployed_at',
        'tx_hash',
    ];

    protected function casts(): array
    {
        return [
            'deployed_at' => 'datetime',
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }
}
