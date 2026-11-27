<?php

namespace App\Services;

use App\Models\MonthlyPayrollAdjustment;
use App\Models\PayrollRecord;
use App\Models\PayrollRun;
use App\Models\StaffPayrollProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PayrollCalculationService
{
    public function calculateForStaff(
        StaffPayrollProfile $staff,
        string $month,
        ?MonthlyPayrollAdjustment $adjustment,
        float $commissionRate,
        array $salesForMonth = [],
    ): array {
        $rate = max(0.0, min(1.0, $commissionRate));
        $baseSalary = max(0.0, (float) $staff->base_salary);
        $allowances = max(0.0, (float) ($adjustment?->allowances ?? 0));
        $deductions = max(0.0, (float) ($adjustment?->deductions ?? 0));

        $eligibleSales = array_values(array_filter(
            $salesForMonth,
            fn (array $sale): bool => (int) ($sale['staff_id'] ?? 0) === (int) $staff->id
                && (float) ($sale['total'] ?? 0) > 0,
        ));

        $eligibleSalesTotal = round(
            array_reduce($eligibleSales, fn (float $sum, array $s): float => $sum + max(0.0, (float) $s['total']), 0.0),
            2,
        );
        $commission = round($eligibleSalesTotal * $rate, 2);
        $netSalary = round($baseSalary + $allowances + $commission - $deductions, 2);

        return [
            'employee' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'jobTitle' => $staff->job_title,
                'baseSalary' => $baseSalary,
            ],
            'month' => $month,
            'baseSalary' => $baseSalary,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'eligibleSalesCount' => count($eligibleSales),
            'eligibleSalesTotal' => $eligibleSalesTotal,
            'commissionRate' => $rate,
            'commission' => $commission,
            'netSalary' => $netSalary,
        ];
    }

    public function buildMonthlyReport(string $month, float $commissionRate): array
    {
        $staffList = StaffPayrollProfile::query()->orderBy('id')->get();
        $adjustments = MonthlyPayrollAdjustment::query()
            ->where('month', $month)
            ->get()
            ->keyBy('staff_id');

        $sales = $this->loadMonthSales($month);

        $rows = $staffList->map(function (StaffPayrollProfile $staff) use ($month, $adjustments, $commissionRate, $sales) {
            return $this->calculateForStaff(
                $staff,
                $month,
                $adjustments->get($staff->id),
                $commissionRate,
                $sales,
            );
        })->values()->all();

        $sum = fn (string $field): float => round(
            array_reduce($rows, fn (float $acc, array $row): float => $acc + (float) $row[$field], 0.0),
            2,
        );

        return [
            'generatedAt' => now()->toIso8601String(),
            'month' => $month,
            'commissionPolicy' => [
                'rate' => max(0.0, min(1.0, $commissionRate)),
                'basis' => 'sale-total-after-discount',
            ],
            'employees' => $rows,
            'totals' => [
                'baseSalary' => $sum('baseSalary'),
                'allowances' => $sum('allowances'),
                'deductions' => $sum('deductions'),
                'commission' => $sum('commission'),
                'netSalary' => $sum('netSalary'),
            ],
        ];
    }

    public function persistRun(string $month, float $commissionRate, ?int $generatedByUserId): PayrollRun
    {
        $report = $this->buildMonthlyReport($month, $commissionRate);

        return DB::transaction(function () use ($month, $report, $generatedByUserId): PayrollRun {
            $run = PayrollRun::query()->updateOrCreate(
                ['month' => $month],
                [
                    'commission_rate' => $report['commissionPolicy']['rate'],
                    'generated_by' => $generatedByUserId,
                    'total_base_salary' => $report['totals']['baseSalary'],
                    'total_allowances' => $report['totals']['allowances'],
                    'total_deductions' => $report['totals']['deductions'],
                    'total_commission' => $report['totals']['commission'],
                    'total_net_salary' => $report['totals']['netSalary'],
                ],
            );

            $run->records()->delete();

            foreach ($report['employees'] as $row) {
                PayrollRecord::query()->create([
                    'payroll_run_id' => $run->id,
                    'staff_id' => $row['employee']['id'],
                    'month' => $month,
                    'base_salary' => $row['baseSalary'],
                    'allowances' => $row['allowances'],
                    'deductions' => $row['deductions'],
                    'eligible_sales_count' => $row['eligibleSalesCount'],
                    'eligible_sales_total' => $row['eligibleSalesTotal'],
                    'commission_rate' => $row['commissionRate'],
                    'commission' => $row['commission'],
                    'net_salary' => $row['netSalary'],
                ]);
            }

            return $run->load('records');
        });
    }

    /**
     * Reads confirmed shop sales for the given YYYY-MM month when Mohamed's sales table is present.
     */
    private function loadMonthSales(string $month): array
    {
        if (!Schema::hasTable('sales')) {
            return [];
        }

        return DB::table('sales')
            ->whereNotNull('staff_id')
            ->where('date', 'like', $month . '-%')
            ->get(['id', 'staff_id', 'total', 'date'])
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'staff_id' => (int) $row->staff_id,
                'total' => (float) $row->total,
                'date' => (string) $row->date,
            ])
            ->all();
    }
}
