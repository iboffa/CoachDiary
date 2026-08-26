import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

function makeSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    user: { id: 'user-1', email: 'coach@example.com', ...overrides },
  } as Session;
}

function createMockClient(initialSession: Session | null = null) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: initialSession }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

async function createService(initialSession: Session | null = null) {
  const client = createMockClient(initialSession);

  await TestBed.configureTestingModule({
    providers: [
      AuthService,
      provideRouter([]),
      { provide: SupabaseService, useValue: { client } },
    ],
  }).compileComponents();

  const service = TestBed.inject(AuthService);
  // provideRouter([]) has no matching routes, so a real navigate() would
  // reject with NG04002 — stub it out; tests that care can still assert
  // on the same spy via TestBed.inject(Router).
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  // Constructor hydration (getSession) is async; let it settle before assertions.
  await Promise.resolve();
  await Promise.resolve();
  return { service, client, router };
}

describe('AuthService', () => {
  // ── constructor session hydration ────────────────────────────────

  describe('constructor', () => {
    it('hydrates session from getSession() on startup', async () => {
      const session = makeSession();
      const { service, client } = await createService(session);
      expect(client.auth.getSession).toHaveBeenCalled();
      expect(service.session).toEqual(session);
    });

    it('leaves session null when getSession() resolves with none', async () => {
      const { service } = await createService(null);
      expect(service.session).toBeNull();
    });

    it('sets ready$ to true once hydration settles', async () => {
      const { service } = await createService(null);
      let ready = false;
      service.ready$.subscribe(v => { ready = v; });
      expect(ready).toBe(true);
    });

    it('subscribes to onAuthStateChange', async () => {
      const { client } = await createService(null);
      expect(client.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('updates session when onAuthStateChange fires', async () => {
      const { service, client } = await createService(null);
      const onChange = client.auth.onAuthStateChange.mock.calls[0][0];
      const newSession = makeSession({ id: 'user-2' });

      onChange('SIGNED_IN', newSession);

      expect(service.session).toEqual(newSession);
    });
  });

  // ── currentUserId ───────────────────────────────────────────────

  describe('currentUserId', () => {
    it('returns the user id when a session exists', async () => {
      const { service } = await createService(makeSession({ id: 'user-42' }));
      expect(service.currentUserId()).toBe('user-42');
    });

    it('returns null when there is no session', async () => {
      const { service } = await createService(null);
      expect(service.currentUserId()).toBeNull();
    });
  });

  // ── signInWithEmail ─────────────────────────────────────────────

  describe('signInWithEmail', () => {
    it('returns null on success', async () => {
      const { service } = await createService(null);
      const result = await service.signInWithEmail('a@b.com', 'password');
      expect(result).toBeNull();
    });

    it('delegates to supabase auth.signInWithPassword with the given credentials', async () => {
      const { service, client } = await createService(null);
      await service.signInWithEmail('a@b.com', 'password');
      expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password' });
    });

    it('returns the error message on failure', async () => {
      const { service, client } = await createService(null);
      client.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid credentials' } });
      const result = await service.signInWithEmail('a@b.com', 'wrong');
      expect(result).toBe('Invalid credentials');
    });
  });

  // ── signUp ──────────────────────────────────────────────────────

  describe('signUp', () => {
    it('returns null on success', async () => {
      const { service } = await createService(null);
      const result = await service.signUp('a@b.com', 'password');
      expect(result).toBeNull();
    });

    it('returns the error message on failure', async () => {
      const { service, client } = await createService(null);
      client.auth.signUp.mockResolvedValue({ data: {}, error: { message: 'Email already registered' } });
      const result = await service.signUp('a@b.com', 'password');
      expect(result).toBe('Email already registered');
    });
  });

  // ── updatePassword ──────────────────────────────────────────────

  describe('updatePassword', () => {
    it('delegates to supabase auth.updateUser', async () => {
      const { service, client } = await createService(null);
      await service.updatePassword('newpassword');
      expect(client.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword' });
    });

    it('returns the error message on failure', async () => {
      const { service, client } = await createService(null);
      client.auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'Password too short' } });
      const result = await service.updatePassword('x');
      expect(result).toBe('Password too short');
    });
  });

  // ── signOut ─────────────────────────────────────────────────────

  describe('signOut', () => {
    it('calls supabase auth.signOut', async () => {
      const { service, client } = await createService(makeSession());
      await service.signOut();
      expect(client.auth.signOut).toHaveBeenCalled();
    });

    it('navigates to /login', async () => {
      const { service, router } = await createService(makeSession());
      await service.signOut();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── handleOAuthCallbackUrl ──────────────────────────────────────

  describe('handleOAuthCallbackUrl', () => {
    it('exchanges the code for a session when present', async () => {
      const { service, client } = await createService(null);
      await service.handleOAuthCallbackUrl('coachdiary://auth-callback?code=abc123');
      expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc123');
    });

    it('navigates to /teams on successful exchange', async () => {
      const { service, router } = await createService(null);
      await service.handleOAuthCallbackUrl('coachdiary://auth-callback?code=abc123');
      expect(router.navigate).toHaveBeenCalledWith(['/teams']);
    });

    it('emits oauthError and does not navigate when the exchange fails', async () => {
      const { service, client, router } = await createService(null);
      client.auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: { message: 'Invalid code' } });
      let emittedError = '';
      service.oauthError$.subscribe(e => { emittedError = e; });

      await service.handleOAuthCallbackUrl('coachdiary://auth-callback?code=bad');

      expect(emittedError).toBe('Invalid code');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('surfaces the callback error_description when there is no code', async () => {
      const { service } = await createService(null);
      let emittedError = '';
      service.oauthError$.subscribe(e => { emittedError = e; });

      await service.handleOAuthCallbackUrl('coachdiary://auth-callback?error_description=access_denied');

      expect(emittedError).toBe('access_denied');
    });

    it('clears oauthInFlight after handling the callback', async () => {
      const { service } = await createService(null);
      let inFlight = true;
      service.oauthInFlight$.subscribe(v => { inFlight = v; });

      await service.handleOAuthCallbackUrl('coachdiary://auth-callback?code=abc123');

      expect(inFlight).toBe(false);
    });
  });
});
