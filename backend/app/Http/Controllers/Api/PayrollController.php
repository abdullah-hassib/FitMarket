<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyPayrollAdjustment;
use App\Models\PayrollRun;
use App\Models\StaffPayrollProfile;
use App\Services\PayrollCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function __construct(private readonly PayrollCalculationService $calculator) {}

    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAccountancy($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);
        $month = $validated['month'];

        $run = PayrollRun::query()->where('month', $month)->first();
        $commissionRatePercent = $run ? round($run->commission_rate * 100, 2) : 5.0;

        $employees = StaffPayrollProfile::query()->orderBy('id')->get()->map(fn (StaffPayrollProfile $s): array => [
            'id' => $s->id,
            'name' => $s->name,
            'jobTitle' => $s->job_title,
            'baseSalary' => (float) $s->base_salary,
        ]);

        $adjustments = MonthlyPayrollAdjustment::query()
            ->where('month', $month)
            ->get()
            ->map(fn (MonthlyPayrollAdjustment $a): array => [
                'employeeId' => $a->staff_id,
                'month' => $a->month,
                'allowances' => (float) $a->allowances,
                'deductions' => (float) $a->deductions,
            ]);

        return response()->json([
            'month' => $month,
            'commissionRatePercent' => $commissionRatePercent,
            'employees' => $employees,
            'adjustments' => $adjustments,
            'sales' => [],
        ]);
    }

    public function updateBaseSalary(Request $request, int $staffId): JsonResponse
    {
        if ($denied = $this->authorizeAccountancy($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'baseSalary' => ['required', 'numeric', 'min:0'],
        ]);

        $staff = StaffPayrollProfile::query()->find($staffId);
        if (!$staff) {
            return response()->json(['message' => 'Staff payroll record not found.'], 404);
        }

        $staff->update(['base_salary' => $validated['baseSalary']]);

        return response()->json(['message' => 'Base salary updated.', 'baseSalary' => (float) $staff->base_salary]);
    }

    public function upsertAdjustment(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAccountancy($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:staff_payroll_profiles,id'],
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'allowances' => ['required', 'numeric', 'min:0'],
            'deductions' => ['required', 'numeric', 'min:0'],
        ]);

        $adjustment = MonthlyPayrollAdjustment::query()->updateOrCreate(
            ['staff_id' => $validated['employeeId'], 'month' => $validated['month']],
            ['allowances' => $validated['allowances'], 'deductions' => $validated['deductions']],
        );

        return response()->json([
            'employeeId' => $adjustment->staff_id,
            'month' => $adjustment->month,
            'allowances' => (float) $adjustment->allowances,
            'deductions' => (float) $adjustment->deductions,
        ]);
    }

    public function run(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAccountancy($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'commissionRatePercent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $rate = ((float) $validated['commissionRatePercent']) / 100.0;
        $run = $this->calculator->persistRun($validated['month'], $rate, $request->user()->id);

        return response()->json([
            'id' => $run->id,
            'month' => $run->month,
            'totalNetSalary' => (float) $run->total_net_salary,
        ], 201);
    }

    public function report(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAccountancy($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);
        $month = $validated['month'];

        $run = PayrollRun::query()->where('month', $month)->first();
        $rate = $run ? (float) $run->commission_rate : 0.05;

        return response()->json($this->calculator->buildMonthlyReport($month, $rate));
    }

    private function authorizeAccountancy(Request $request): ?JsonResponse
    {
        $actor = $request->user();
        if (!$actor) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }
        if (!$actor->canManagePayroll()) {
            return response()->json(['message' => 'Only accountants or admins can view or modify payroll.'], 403);
        }

        return null;
    }
}
