import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Session, Provider } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ElectronService } from './electron.service';

const OAUTH_CALLBACK_URL = 'coachdiary://auth-callback';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly electron = inject(ElectronService);
  private readonly _session$ = new BehaviorSubject<Session | null>(null);
  private readonly _ready$ = new BehaviorSubject<boolean>(false);
  private readonly _oauthError$ = new Subject<string>();

  private readonly _oauthInFlight$ = new BehaviorSubject<boolean>(false);

  readonly session$: Observable<Session | null> = this._session$.asObservable();
  readonly ready$: Observable<boolean> = this._ready$.asObservable();
  readonly oauthError$: Observable<string> = this._oauthError$.asObservable();
  readonly oauthInFlight$: Observable<boolean> = this._oauthInFlight$.asObservable();

  constructor(private router: Router) {
    // Hydrate from existing session on startup — this also resolves any
    // OAuth tokens present in the URL, so guards must wait for it before
    // deciding whether a route requires a redirect to /login.
    this.supabase.client.auth.getSession()
      .then(({ data }) => this._session$.next(data.session))
      .catch(err => console.error('[Auth] getSession failed:', err))
      .finally(() => this._ready$.next(true));

    // Keep session in sync for the lifetime of the app
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
    });

    // Native platforms complete OAuth via a custom-scheme redirect rather
    // than a same-window navigation — catch it here and exchange the code.
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', event => {
        this.handleOAuthCallbackUrl(event.url);
      });
      // Resets the in-flight guard if the user backs out of the browser
      // without completing sign-in, so a retry isn't blocked forever.
      Browser.addListener('browserFinished', () => {
        this._oauthInFlight$.next(false);
      });
    } else if (this.electron.isElectron) {
      this.electron.onAuthCallback(url => this.handleOAuthCallbackUrl(url).catch(err => {
        console.error('[Auth] Electron OAuth callback error:', err);
        this._oauthError$.next(err instanceof Error ? err.message : String(err));
        this._oauthInFlight$.next(false);
      }));
    }
  }

  async handleOAuthCallbackUrl(url: string): Promise<void> {
    const params = new URL(url).searchParams;
    const code = params.get('code');
    const callbackError = params.get('error_description') || params.get('error');
    const { error } = code
      ? await this.supabase.client.auth.exchangeCodeForSession(code)
      : { error: new Error(callbackError ?? 'No authorization code in OAuth callback URL.') };
    this._oauthInFlight$.next(false);

    if (Capacitor.isNativePlatform()) {
      await Browser.close().catch(() => undefined);
    }

    if (error) {
      console.error('[Auth] OAuth code exchange failed:', error.message);
      this._oauthError$.next(error.message);
    } else {
      this.router.navigate(['/teams']);
    }
  }

  get session(): Session | null {
    return this._session$.getValue();
  }

  currentUserId(): string | null {
    return this.session?.user.id ?? null;
  }

  async signInWithGoogle(): Promise<void> {
    await this.signInWithOAuthProvider('google');
  }

  async signInWithApple(): Promise<void> {
    await this.signInWithOAuthProvider('apple');
  }

  async signInWithFacebook(): Promise<void> {
    await this.signInWithOAuthProvider('facebook');
  }

  private async signInWithOAuthProvider(provider: Provider): Promise<void> {
    // A second tap while the browser/custom-tab is still opening would
    // overwrite the PKCE code_verifier for a flow that's already in
    // progress, desyncing it from whichever tab the user actually
    // completes sign-in in ("invalid flow state" on exchange).
    if (this._oauthInFlight$.value) return;
    this._oauthInFlight$.next(true);

    const isNative = Capacitor.isNativePlatform() || this.electron.isElectron;

    const { data, error } = await this.supabase.client.auth.signInWithOAuth({
      provider,
      options: isNative
        ? { redirectTo: OAUTH_CALLBACK_URL, skipBrowserRedirect: true }
        : { redirectTo: `${window.location.origin}/teams` },
    });

    if (error) {
      console.error(`[Auth] signInWithOAuth(${provider}) failed:`, error.message);
      this._oauthError$.next(error.message);
      this._oauthInFlight$.next(false);
      return;
    }

    // On web, signInWithOAuth already navigated the page away — nothing left to do.
    if (!data?.url) {
      this._oauthInFlight$.next(false);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      // Stays in-flight until the deep-link callback or 'browserFinished'
      // resolves it, so the caller's loading state spans the whole flow
      // rather than just the moment the Custom Tab is launched.
      await Browser.open({ url: data.url });
    } else if (this.electron.isElectron) {
      await this.electron.invoke('shell:openExternal', data.url);
      this._oauthInFlight$.next(false);
    } else {
      window.location.href = data.url;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async signUp(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signUp({ email, password });
    return error?.message ?? null;
  }

  async updatePassword(password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    return error?.message ?? null;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}
