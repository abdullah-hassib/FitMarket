import { Component, effect, ElementRef, input, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import type { Chart } from 'chart.js';
import type { Summary } from '../services/budget-engine';

/** Values for the interactive chart, shared with the accessible table. */
export function chartValues(summaries: readonly Summary[]) {
  return {
    labels: summaries.map(entry => entry.department),
    income: summaries.map(entry => entry.income),
    expenses: summaries.map(entry => entry.expenses),
    balances: summaries.map(entry => entry.balance)
  };
}

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  template: `<div class="budget-chart" aria-label="Department income, expenses and balance chart">
    <canvas #chartCanvas role="img" aria-label="Department budget comparison chart. Full figures appear in the accessible table below."></canvas>
  </div>`,
  styleUrl: './budget-chart.css'
})
export class BudgetChart implements AfterViewInit, OnDestroy {
  readonly summaries = input.required<readonly Summary[]>();
  @ViewChild('chartCanvas') private readonly chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'bar'>;
  private disposed = false;

  constructor() {
    effect(() => this.syncChart(this.summaries()));
  }

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // In test DOMs without a canvas implementation, keep the text/table fallback.
    let context: CanvasRenderingContext2D | null;
    try {
      context = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!context) return;

    const { default: ChartJS } = await import('chart.js/auto');
    if (this.disposed) return;

    this.chart = new ChartJS(context, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          { label: 'Income', data: [], backgroundColor: '#f04455', borderRadius: 5 },
          { label: 'Expenses', data: [], backgroundColor: '#858594', borderRadius: 5 },
          { label: 'Balance', data: [], backgroundColor: '#f3b86a', borderRadius: 5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#ececf2', padding: 18 } },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: EGP ${Number(context.parsed.y ?? 0).toLocaleString('en-EG')}`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#cacad3' }, grid: { display: false } },
          y: { ticks: { color: '#cacad3' }, grid: { color: '#393943' }, beginAtZero: true }
        }
      }
    });

    this.syncChart(this.summaries());
  }

  private syncChart(values: readonly Summary[]): void {
    if (!this.chart) return;
    const data = chartValues(values);
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.income;
    this.chart.data.datasets[1].data = data.expenses;
    this.chart.data.datasets[2].data = data.balances;
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.chart?.destroy();
  }
}
