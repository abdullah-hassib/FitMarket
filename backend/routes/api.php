<?php

use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // User Profile CRUD
    Route::get('/profiles/{userId}', [ProfileController::class, 'show']);
    Route::post('/profiles', [ProfileController::class, 'store']);
    Route::put('/profiles/{userId}', [ProfileController::class, 'update']);
    Route::delete('/profiles/{userId}', [ProfileController::class, 'destroy']);

    // Payroll & Monthly JSON Report (accountant / admin only)
    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::patch('/payroll/employees/{staffId}', [PayrollController::class, 'updateBaseSalary']);
    Route::put('/payroll/adjustments', [PayrollController::class, 'upsertAdjustment']);
    Route::post('/payroll/run', [PayrollController::class, 'run']);
    Route::get('/payroll/report', [PayrollController::class, 'report']);
});
