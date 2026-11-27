<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    protected $fillable = [
        'month',
        'commission_rate',
        'generated_by',
        'total_base_salary',
        'total_allowances',
        'total_deductions',
        'total_commission',
        'total_net_salary',
    ];

    protected $casts = [
        'commission_rate' => 'float',
        'total_base_salary' => 'float',
        'total_allowances' => 'float',
        'total_deductions' => 'float',
        'total_commission' => 'float',
        'total_net_salary' => 'float',
    ];

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function records(): HasMany
    {
        return $this->hasMany(PayrollRecord::class);
    }
}
