<?php

namespace Tests\Feature;

use App\Models\StaffPayrollProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PayrollApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_accountant_is_blocked_with_403_and_unauthenticated_with_401(): void
    {
        $this->getJson('/api/payroll?month=2026-11')->assertStatus(401);

        $trainee = User::query()->create([
            'username' => 'trainee_p',
            'name' => 'Trainee',
            'email' => 'trainee_p@fitmarket.test',
            'role' => 'trainee',
            'password' => bcrypt('secret123'),
        ]);

        Sanctum::actingAs($trainee);
        $this->getJson('/api/payroll?month=2026-11')->assertStatus(403);
        $this->postJson('/api/payroll/run', ['month' => '2026-11', 'commissionRatePercent' => 5])->assertStatus(403);
        $this->getJson('/api/payroll/report?month=2026-11')->assertStatus(403);
    }

    public function test_accountant_can_update_adjustments_run_payroll_and_export_matching_json(): void
    {
        $accountant = User::query()->create([
            'username' => 'acct1',
            'name' => 'Accountant One',
            'email' => 'acct1@fitmarket.test',
            'role' => 'accountant',
            'password' => bcrypt('secret123'),
        ]);

        $staff = StaffPayrollProfile::query()->create([
            'name' => 'Mina Adel',
            'job_title' => 'Sales Coach',
            'base_salary' => 8000,
        ]);

        Sanctum::actingAs($accountant);

        $this->patchJson("/api/payroll/employees/{$staff->id}", [
            'baseSalary' => 8500,
        ])->assertStatus(200);

        $this->putJson('/api/payroll/adjustments', [
            'employeeId' => $staff->id,
            'month' => '2026-11',
            'allowances' => 600,
            'deductions' => 250,
        ])->assertStatus(200);

        $this->postJson('/api/payroll/run', [
            'month' => '2026-11',
            'commissionRatePercent' => 5,
        ])->assertStatus(201)->assertJsonPath('month', '2026-11');

        $report = $this->getJson('/api/payroll/report?month=2026-11')
            ->assertStatus(200)
            ->assertJsonPath('month', '2026-11')
            ->assertJsonPath('totals.netSalary', 8850);

        $this->assertEquals(8850, $report->json('employees.0.netSalary'));
    }

    public function test_invalid_payroll_inputs_return_422_and_missing_staff_returns_404(): void
    {
        $accountant = User::query()->create([
            'username' => 'acct2',
            'name' => 'Accountant Two',
            'email' => 'acct2@fitmarket.test',
            'role' => 'accountant',
            'password' => bcrypt('secret123'),
        ]);

        Sanctum::actingAs($accountant);

        $this->patchJson('/api/payroll/employees/9999', ['baseSalary' => 1000])->assertStatus(404);
        $this->putJson('/api/payroll/adjustments', [
            'employeeId' => 9999,
            'month' => 'invalid-month',
            'allowances' => -10,
            'deductions' => -5,
        ])->assertStatus(422);
    }
}
