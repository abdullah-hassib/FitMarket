import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentFeesPage } from './student-fees-page';

describe('StudentFeesPage', () => {
  let component: StudentFeesPage;
  let fixture: ComponentFixture<StudentFeesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentFeesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentFeesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
