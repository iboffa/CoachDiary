import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = new SupabaseService();
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
  }

  get session(): Session | null {
    return this._session$.getValue();
  }

  currentUserId(): string | null {
    return this.session?.user.id ?? null;
  }

  async signInWithGoogle(): Promise<void> {
    await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/teams` },
    });
  }

  async signInWithApple(): Promise<void> {
    await this.supabase.client.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/teams` },
    });
  }

  async signInWithFacebook(): Promise<void> {
    await this.supabase.client.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/teams` },
    });
  }

  async signInWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async signUp(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signUp({ email, password });
    return error?.message ?? null;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}
