import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { MOCK_ACCOUNTS } from '../../../core/auth/mock-accounts';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let auth: Auth;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    auth = TestBed.inject(Auth);
    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads, updates, deletes, and recreates a logged-in user profile', async () => {
    const trainee = MOCK_ACCOUNTS.find((a) => a.user.role === 'trainee')!;
    await auth.login(trainee.user.username, trainee.password);
    fixture.detectChanges();
    await component.loadProfile(trainee.user.id);

    expect(component.profile()?.email).toBe(trainee.user.email);

    component.startEdit();
    component.formName.set('Abdelrahman Trainee');
    component.formFitnessGoal.set('Marathon');
    await component.saveProfile();

    expect(component.profile()?.name).toBe('Abdelrahman Trainee');
    expect(component.editing()).toBe(false);

    // Simulate reload: create a fresh component instance and verify persisted data loads.
    const secondFixture = TestBed.createComponent(Profile);
    await secondFixture.componentInstance.loadProfile(trainee.user.id);
    expect(secondFixture.componentInstance.profile()?.name).toBe('Abdelrahman Trainee');

    // Delete and recreate.
    await component.deleteProfile();
    expect(component.profile()).toBeNull();

    component.startEdit();
    component.formName.set('Recreated User');
    component.formEmail.set(trainee.user.email);
    await component.saveProfile();
    expect(component.profile()?.name).toBe('Recreated User');
  });

  it('shows validation errors on invalid profile submission', async () => {
    const trainee = MOCK_ACCOUNTS.find((a) => a.user.role === 'trainee')!;
    await auth.login(trainee.user.username, trainee.password);
    await component.loadProfile(trainee.user.id);

    component.startEdit();
    component.formName.set('X');
    component.formEmail.set('invalid');
    await component.saveProfile();

    expect(component.errorMessage()).toBeTruthy();
    expect(component.fieldErrors()['name']?.length).toBeGreaterThan(0);
    expect(component.fieldErrors()['email']?.length).toBeGreaterThan(0);
  });
});
