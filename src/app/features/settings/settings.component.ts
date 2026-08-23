import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  readonly email = this.auth.session?.user.email ?? '';

  password = '';
  confirmPassword = '';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  async savePassword(): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    if (!this.password || this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.saving.set(true);
    const err = await this.auth.updatePassword(this.password);
    this.saving.set(false);

    if (err) {
      this.error.set(err);
    } else {
      this.success.set('Password updated.');
      this.password = '';
      this.confirmPassword = '';
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
