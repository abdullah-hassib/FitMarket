<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRecord extends Model
{
    protected $fillable = [
        'payroll_run_id',
        'staff_id',
        'month',
        'base_salary',
        'allowances',
        'deductions',
        'eligible_sales_count',
        'eligible_sales_total',
        'commission_rate',
        'commission',
        'net_salary',
    ];

    protected $casts = [
        'base_salary' => 'float',
        'allowances' => 'float',
        'deductions' => 'float',
        'eligible_sales_count' => 'integer',
        'eligible_sales_total' => 'float',
        'commission_rate' => 'float',
        'commission' => 'float',
        'net_salary' => 'float',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(StaffPayrollProfile::class, 'staff_id');
    }
}
