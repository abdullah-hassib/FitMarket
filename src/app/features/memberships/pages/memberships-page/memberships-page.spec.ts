import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembershipsPage } from './memberships-page';

describe('MembershipsPage', () => {
  let component: MembershipsPage;
  let fixture: ComponentFixture<MembershipsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembershipsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MembershipsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
