<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('staff_payroll_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 120);
            $table->string('job_title', 120);
            $table->decimal('base_salary', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('monthly_payroll_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff_payroll_profiles')->cascadeOnDelete();
            $table->char('month', 7); // YYYY-MM
            $table->decimal('allowances', 10, 2)->default(0);
            $table->decimal('deductions', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['staff_id', 'month']);
        });

        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->char('month', 7)->unique();
            $table->decimal('commission_rate', 5, 4)->default(0.0500);
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_base_salary', 12, 2)->default(0);
            $table->decimal('total_allowances', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('total_commission', 12, 2)->default(0);
            $table->decimal('total_net_salary', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained('payroll_runs')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff_payroll_profiles')->cascadeOnDelete();
            $table->char('month', 7);
            $table->decimal('base_salary', 10, 2);
            $table->decimal('allowances', 10, 2);
            $table->decimal('deductions', 10, 2);
            $table->unsignedInteger('eligible_sales_count')->default(0);
            $table->decimal('eligible_sales_total', 12, 2)->default(0);
            $table->decimal('commission_rate', 5, 4);
            $table->decimal('commission', 10, 2);
            $table->decimal('net_salary', 10, 2);
            $table->timestamps();

            $table->unique(['payroll_run_id', 'staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
        Schema::dropIfExists('payroll_runs');
        Schema::dropIfExists('monthly_payroll_adjustments');
        Schema::dropIfExists('staff_payroll_profiles');
    }
};
