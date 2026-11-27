<?php

namespace Database\Seeders;

use App\Models\MonthlyPayrollAdjustment;
use App\Models\StaffPayrollProfile;
use Illuminate\Database\Seeder;

class PayrollSeeder extends Seeder
{
    public function run(): void
    {
        $staff = [
            ['id' => 101, 'name' => 'Nour Samir', 'job_title' => 'Gym Manager', 'base_salary' => 12500],
            ['id' => 102, 'name' => 'Mina Adel', 'job_title' => 'Sales Coach', 'base_salary' => 8000],
            ['id' => 103, 'name' => 'Laila Fathy', 'job_title' => 'Receptionist', 'base_salary' => 6500],
        ];

        foreach ($staff as $row) {
            StaffPayrollProfile::query()->updateOrCreate(['id' => $row['id']], $row);
        }

        $adjustments = [
            ['staff_id' => 101, 'month' => '2026-11', 'allowances' => 800, 'deductions' => 0],
            ['staff_id' => 102, 'month' => '2026-11', 'allowances' => 600, 'deductions' => 250],
            ['staff_id' => 103, 'month' => '2026-11', 'allowances' => 300, 'deductions' => 100],
        ];

        foreach ($adjustments as $adj) {
            MonthlyPayrollAdjustment::query()->updateOrCreate(
                ['staff_id' => $adj['staff_id'], 'month' => $adj['month']],
                ['allowances' => $adj['allowances'], 'deductions' => $adj['deductions']],
            );
        }
    }
}
