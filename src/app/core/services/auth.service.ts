import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Session, Provider } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ElectronService } from './electron.service';

const OAUTH_CALLBACK_URL = 'coachdiary://auth-callback';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = new SupabaseService();
  private readonly electron = inject(ElectronService);
  private readonly _session$ = new BehaviorSubject<Session | null>(null);

  readonly session$: Observable<Session | null> = this._session$.asObservable();

  constructor(private router: Router) {
    // Hydrate from existing session on startup
    this.supabase.client.auth.getSession().then(({ data }) => {
      this._session$.next(data.session);
    });

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
    } else if (this.electron.isElectron) {
      this.electron.onAuthCallback(url => this.handleOAuthCallbackUrl(url));
    }
  }

  async handleOAuthCallbackUrl(url: string): Promise<void> {
    const { error } = await this.supabase.client.auth.exchangeCodeForSession(url);
    if (!error) {
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
    const isNative = Capacitor.isNativePlatform() || this.electron.isElectron;

    const { data } = await this.supabase.client.auth.signInWithOAuth({
      provider,
      options: isNative
        ? { redirectTo: OAUTH_CALLBACK_URL, skipBrowserRedirect: true }
        : { redirectTo: `${window.location.origin}/teams` },
    });

    // On web, signInWithOAuth already navigated the page away — nothing left to do.
    if (!data?.url) return;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: data.url });
    } else if (this.electron.isElectron) {
      await this.electron.invoke('shell:openExternal', data.url);
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
