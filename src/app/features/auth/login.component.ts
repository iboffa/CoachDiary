import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type Mode = 'social' | 'email';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  mode: Mode = 'social';
  isSignUp = false;

  email = '';
  password = '';

  readonly loading = signal(false);
  // Reflects the whole native OAuth round trip (Custom Tab open → provider
  // consent → deep-link callback), not just the moment the tab is launched.
  readonly socialLoading = toSignal(this.auth.oauthInFlight$, { initialValue: false });
  readonly error = signal<string | null>(null);

  constructor() {
    this.auth.oauthError$.pipe(takeUntilDestroyed()).subscribe(message => this.error.set(message));
  }

  async signInGoogle(): Promise<void> {
    if (this.socialLoading()) return;
    this.error.set(null);
    await this.auth.signInWithGoogle();
  }

  async signInApple(): Promise<void> {
    if (this.socialLoading()) return;
    this.error.set(null);
    await this.auth.signInWithApple();
  }

  async signInFacebook(): Promise<void> {
    if (this.socialLoading()) return;
    this.error.set(null);
    await this.auth.signInWithFacebook();
  }

  async submitEmail(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    const err = this.isSignUp
      ? await this.auth.signUp(this.email, this.password)
      : await this.auth.signInWithEmail(this.email, this.password);

    this.loading.set(false);

    if (err) {
      this.error.set(err);
    } else if (!this.isSignUp) {
      this.router.navigate(['/teams']);
    } else {
      this.error.set('Check your email to confirm your account.');
    }
  }
}
