<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffPayrollProfile extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'job_title',
        'base_salary',
    ];

    protected $casts = [
        'base_salary' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(MonthlyPayrollAdjustment::class, 'staff_id');
    }

    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class, 'staff_id');
    }
}
