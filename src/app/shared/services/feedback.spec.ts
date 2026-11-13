import { TestBed } from '@angular/core/testing';
import { Feedback } from './feedback';

describe('feedback notices', () => {
  it('replaces a previous message and can be dismissed', () => {
    TestBed.configureTestingModule({});
    const feedback = TestBed.inject(Feedback);
    feedback.show('success', 'Added to cart');
    expect(feedback.notice()?.kind).toBe('success');
    feedback.show('error', 'Stock unavailable');
    expect(feedback.notice()?.message).toBe('Stock unavailable');
    feedback.dismiss();
    expect(feedback.notice()).toBeNull();
  });
});
