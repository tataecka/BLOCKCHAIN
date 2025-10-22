<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlockchainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    /**
     * Mine a new block from pending transactions.
     *
     * @param  \App\Services\BlockchainService  $blockchainService
     * @return \Illuminate\Http\JsonResponse
     */
    public function mine(BlockchainService $blockchainService): JsonResponse
    {
        $block = $blockchainService->mineBlock();

        if (!$block) {
            return response()->json([
                'message' => 'No pending transactions to mine.'
            ], 400);
        }

        // Load transactions for full response
        $block->load('transactions');

        return response()->json($block, 201);
    }

    /**
     * Get all blocks in the blockchain.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        $blocks = \App\Models\Block::with('transactions')
            ->orderBy('index_no', 'asc')
            ->get();

        return response()->json($blocks);
    }

    /**
     * Validate the integrity of the entire blockchain.
     *
     * @param  \App\Services\BlockchainService  $blockchainService
     * @return \Illuminate\Http\JsonResponse
     */
    public function validate(BlockchainService $blockchainService): JsonResponse
    {
        $isValid = $blockchainService->validateChain();

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid
                ? 'Blockchain is secure and unmodified.'
                : 'Blockchain has been tampered with or is invalid.'
        ]);
    }
}