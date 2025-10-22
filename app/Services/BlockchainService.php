<?php

namespace App\Services;

use App\Models\Block;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class BlockchainService
{
    const DIFFICULTY = 2; // Hash must start with '00'

    public function generateHash($data): string
    {
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK));
    }

    public function mineBlock()
    {
        $pendingTransactions = Transaction::where('status', 'pending')->get();
        if ($pendingTransactions->isEmpty()) {
            return null;
        }

        $lastBlock = Block::orderBy('index_no', 'desc')->first();
        $previousHash = $lastBlock ? $lastBlock->current_hash : '0';

        $index = $lastBlock ? $lastBlock->index_no + 1 : 1;
        $timestamp = now();

        $nonce = 0;
        $hash = '';

        do {
            $blockData = [
                'index' => $index,
                'timestamp' => $timestamp->toISOString(),
                'previous_hash' => $previousHash,
                'transactions' => $pendingTransactions->map->only(['id', 'sender', 'receiver', 'amount', 'timestamp']),
                'nonce' => $nonce
            ];

            $hash = $this->generateHash($blockData);
            $nonce++;
        } while (!$this->isValidHash($hash));

        // Save block
        $block = Block::create([
            'index_no' => $index,
            'previous_hash' => $previousHash,
            'current_hash' => $hash,
            'nonce' => $nonce - 1,
            'timestamp' => $timestamp
        ]);

        // Attach transactions & mark as mined
        foreach ($pendingTransactions as $tx) {
            $block->transactions()->attach($tx->id);
            $tx->update(['status' => 'mined']);
        }

        return $block;
    }

    private function isValidHash(string $hash): bool
    {
        return substr($hash, 0, self::DIFFICULTY) === str_repeat('0', self::DIFFICULTY);
    }

    public function validateChain(): bool
    {
        $blocks = Block::orderBy('index_no')->get();

        if ($blocks->isEmpty()) {
            Log::info('Blockchain is empty — considered valid.');
            return true;
        }

        // Validate genesis block
        if ($blocks[0]->previous_hash !== '0') {
            Log::error('Genesis block validation failed', [
                'block_id' => $blocks[0]->id,
                'index_no' => $blocks[0]->index_no,
                'actual_previous_hash' => $blocks[0]->previous_hash,
                'expected_previous_hash' => '0'
            ]);
            return false;
        }

        // Validate each subsequent block
        for ($i = 1; $i < count($blocks); $i++) {
            $current = $blocks[$i];
            $previous = $blocks[$i - 1];

            // 1. Check hash linkage
            if ($current->previous_hash !== $previous->current_hash) {
                Log::error('Block hash linkage broken', [
                    'block_id' => $current->id,
                    'index_no' => $current->index_no,
                    'expected_previous_hash' => $previous->current_hash,
                    'actual_previous_hash' => $current->previous_hash,
                    'previous_block_id' => $previous->id,
                    'previous_block_hash' => $previous->current_hash
                ]);
                return false;
            }

            // 2. Re-compute hash and verify integrity
            $expectedData = [
                'index' => $current->index_no,
                'timestamp' => $current->timestamp->toISOString(),
                'previous_hash' => $current->previous_hash,
                'transactions' => $current->transactions->map->only(['id', 'sender', 'receiver', 'amount', 'timestamp']),
                'nonce' => $current->nonce
            ];

            $expectedHash = $this->generateHash($expectedData);

            if ($expectedHash !== $current->current_hash) {
                Log::error('Block hash mismatch — possible tampering', [
                    'block_id' => $current->id,
                    'index_no' => $current->index_no,
                    'expected_hash' => $expectedHash,
                    'actual_hash' => $current->current_hash,
                    'nonce' => $current->nonce,
                    'transaction_count' => $current->transactions->count()
                ]);
                return false;
            }
        }

        Log::info('Blockchain validation passed — chain is secure.');
        return true;
    }
}