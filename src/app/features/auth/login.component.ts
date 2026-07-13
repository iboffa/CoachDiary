import { Component, signal } from '@angular/core';
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
  mode: Mode = 'social';
  isSignUp = false;

  email = '';
  password = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  async signInGoogle(): Promise<void> {
    this.error.set(null);
    await this.auth.signInWithGoogle();
  }

  async signInApple(): Promise<void> {
    this.error.set(null);
    await this.auth.signInWithApple();
  }

  async signInFacebook(): Promise<void> {
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
