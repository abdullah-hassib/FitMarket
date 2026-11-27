import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Auth } from '../../../core/auth/auth';
import { MOCK_ACCOUNTS } from '../../../core/auth/mock-accounts';
import { PROFILE_USE_API, ProfileService } from './profile.service';

describe('ProfileService (HTTP API mode)', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PROFILE_USE_API, useValue: true },
      ],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retrieves, creates, updates, and deletes via REST endpoints', async () => {
    const sample = {
      id: 1,
      userId: 3,
      name: 'Trainee One',
      email: 'trainee@fitmarket.test',
      phone: '01001234567',
      bio: 'Runner',
      fitnessGoal: '10k',
      profilePicture: '',
      preferences: ['Protein'],
      updatedAt: '2026-11-27T10:00:00Z',
    };

    const getPromise = service.getProfile(3);
    httpMock.expectOne('/api/profiles/3').flush(sample);
    expect((await getPromise).name).toBe('Trainee One');

    const createPromise = service.createProfile(3, {
      name: 'Trainee One',
      email: 'trainee@fitmarket.test',
      phone: '01001234567',
      bio: 'Runner',
      fitnessGoal: '10k',
      profilePicture: '',
      preferences: ['Protein'],
    });
    const createReq = httpMock.expectOne('/api/profiles');
    expect(createReq.request.method).toBe('POST');
    createReq.flush(sample);
    expect((await createPromise).userId).toBe(3);

    const updatePromise = service.updateProfile(3, {
      name: 'Trainee Updated',
      email: 'trainee@fitmarket.test',
      phone: '01001234567',
      bio: 'Sprinter',
      fitnessGoal: '5k',
      profilePicture: '',
      preferences: ['Weights'],
    });
    const updateReq = httpMock.expectOne('/api/profiles/3');
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({ ...sample, name: 'Trainee Updated' });
    expect((await updatePromise).name).toBe('Trainee Updated');

    const deletePromise = service.deleteProfile(3);
    const deleteReq = httpMock.expectOne('/api/profiles/3');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
    await deletePromise;
  });

  it('rejects invalid input before calling the server', async () => {
    let caughtStatus = 0;
    try {
      await service.updateProfile(3, {
        name: 'A',
        email: 'bad-email',
        phone: '',
        bio: '',
        fitnessGoal: '',
        profilePicture: '',
        preferences: [],
      });
    } catch (err) {
      caughtStatus = (err as { status: number }).status;
    }
    expect(caughtStatus).toBe(422);
  });
});

describe('ProfileService (local persistence & authorization)', () => {
  let service: ProfileService;
  let auth: Auth;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    auth = TestBed.inject(Auth);
  });

  it('persists profile updates across logout and re-login and blocks non-admin cross-user edits', async () => {
    const trainee = MOCK_ACCOUNTS.find((a) => a.user.role === 'trainee')!;
    const admin = MOCK_ACCOUNTS.find((a) => a.user.role === 'admin')!;

    await auth.login(trainee.user.username, trainee.password);
    const loaded = await service.getProfile(trainee.user.id);
    expect(loaded.email).toBe(trainee.user.email);

    await service.updateProfile(trainee.user.id, {
      name: 'Updated Trainee',
      email: trainee.user.email,
      phone: '01012345678',
      bio: 'Morning lifter',
      fitnessGoal: 'Hypertrophy',
      profilePicture: '',
      preferences: ['Whey', 'Creatine'],
    });

    // Non-admin cannot edit another user's profile.
    let forbiddenStatus = 0;
    try {
      await service.updateProfile(admin.user.id, {
        name: 'Hacked Admin',
        email: admin.user.email,
        phone: '',
        bio: '',
        fitnessGoal: '',
        profilePicture: '',
        preferences: [],
      });
    } catch (err) {
      forbiddenStatus = (err as { status: number }).status;
    }
    expect(forbiddenStatus).toBe(403);

    // Re-login preserves the saved profile.
    auth.logout();
    await auth.login(trainee.user.username, trainee.password);
    const reloaded = await service.getProfile(trainee.user.id);
    expect(reloaded.name).toBe('Updated Trainee');
    expect(reloaded.fitnessGoal).toBe('Hypertrophy');
  });
});
