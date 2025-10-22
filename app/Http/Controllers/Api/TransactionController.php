<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    /**
     * Create a new pending transaction.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'sender' => 'required|string|max:255',
            'receiver' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
        ]);

        // Ensure sender ≠ receiver
        if ($validated['sender'] === $validated['receiver']) {
            throw ValidationException::withMessages([
                'sender' => 'Sender and receiver cannot be the same.'
            ]);
        }

        // Create transaction with 'pending' status
        $transaction = Transaction::create([
            'sender' => $validated['sender'],
            'receiver' => $validated['receiver'],
            'amount' => $validated['amount'],
            'timestamp' => now(),
            'status' => 'pending',
        ]);

        return response()->json($transaction, 201);
    }

    /**
     * Get all pending transactions.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function pending()
    {
        $pendingTransactions = Transaction::where('status', 'pending')->get();

        return response()->json($pendingTransactions);
    }

    /**
     * Delete a pending transaction (cannot delete mined transactions).
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $transaction = Transaction::where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $transaction->delete();

        return response()->json([
            'message' => 'Pending transaction deleted successfully.'
        ]);
    }
}