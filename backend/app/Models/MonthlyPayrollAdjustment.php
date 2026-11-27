<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyPayrollAdjustment extends Model
{
    protected $fillable = [
        'staff_id',
        'month',
        'allowances',
        'deductions',
    ];

    protected $casts = [
        'allowances' => 'float',
        'deductions' => 'float',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(StaffPayrollProfile::class, 'staff_id');
    }
}
