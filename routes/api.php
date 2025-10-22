<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\BlockController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Public blockchain simulation API endpoints.
| These routes are automatically prefixed with '/api' and do not require authentication.
|
*/

// Transaction endpoints
Route::post('/transaction', [TransactionController::class, 'store']);
Route::get('/transactions/pending', [TransactionController::class, 'pending']);

// Block and blockchain endpoints
Route::post('/block/mine', [BlockController::class, 'mine']);
Route::get('/blocks', [BlockController::class, 'index']);
Route::get('/blockchain/validate', [BlockController::class, 'validate']);
Route::delete('/transaction/{id}', [TransactionController::class, 'destroy']);