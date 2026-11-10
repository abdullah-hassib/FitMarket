import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BUDGET_ROLE } from '../services/budget-access';
import { BudgetsPage } from './budgets-page';

describe('BudgetsPage', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [BudgetsPage],
      providers: [provideRouter([]), { provide: BUDGET_ROLE, useValue: () => 'accountant' }],
    }),
  );
  it('renders accessible chart data, filters all outputs and handles empty ranges', async () => {
    const fixture = TestBed.createComponent(BudgetsPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('caption').textContent).toContain('Chart values');
    const page = fixture.componentInstance;
    page.department.set('Events');
    expect(page.totals().balance).toBe(-700);
    expect(page.summaries().length).toBe(1);
    page.from.set('2027-01-01');
    expect(page.rows()).toEqual([]);
    expect(page.totals().income).toBe(0);
    page.to.set('2026-01-01');
    expect(page.filterError()).toBeTruthy();
  });
  it('saves a record and edits it through the page handlers', () => {
    const page = TestBed.createComponent(BudgetsPage).componentInstance;
    page.draft = {
      id: '',
      department: 'Events',
      type: 'income',
      amount: 20,
      date: '2026-11-09',
      description: 'Demo ticket',
    };
    page.save();
    const row = page.rows().find((e) => e.description === 'Demo ticket')!;
    page.edit(row);
    page.draft.amount = 30;
    page.save();
    expect(page.rows().filter((e) => e.description === 'Demo ticket').length).toBe(1);
    expect(page.rows().find((e) => e.id === row.id)?.amount).toBe(30);
  });
});
