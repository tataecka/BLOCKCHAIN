<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'index_no',
        'previous_hash',
        'current_hash',
        'nonce',
        'timestamp',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'timestamp' => 'datetime',
        'index_no' => 'integer',
        'nonce' => 'integer',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array<string>
     */
    protected $dates = [
        'timestamp',
    ];

    /**
     * Get the transactions contained in this block.
     */
    public function transactions()
    {
        return $this->belongsToMany(Transaction::class, 'block_transactions');
    }
}