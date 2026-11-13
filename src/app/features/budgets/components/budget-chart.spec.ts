import { chartValues } from './budget-chart';

describe('Budget chart values', () => {
  it('preserves signed balances and filtered department order', () => {
    expect(chartValues([
      { department: 'Shop', income: 450, expenses: 150, balance: 300 },
      { department: 'Events', income: 70, expenses: 130, balance: -60 }
    ])).toEqual({
      labels: ['Shop', 'Events'],
      income: [450, 70],
      expenses: [150, 130],
      balances: [300, -60]
    });
  });

  it('produces empty datasets for empty filters', () => {
    expect(chartValues([])).toEqual({
      labels: [], income: [], expenses: [], balances: []
    });
  });
});
