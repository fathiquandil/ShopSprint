
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LanguageService, Language } from '../../../core/services/language';

interface LoginResponse {
  message: string;
  token: string;
  manager: {
    id: string;
    username: string;
  };
}

@Component({
  selector: 'app-manager-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';

  isLoading = false;
  errorMessage = '';

  currentLanguage: Language = 'en';

  private apiUrl = 'http://localhost:3000/api/manager/login';

  constructor(
    private http: HttpClient,
    private router: Router,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.markForCheck();
    });
  }

  toggleLanguage(): void {
    const newLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';

    this.languageService.setLanguage(newLanguage);
  }

  login(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.password) {
      this.errorMessage =
        this.currentLanguage === 'ar'
          ? 'من فضلك أدخل اسم المستخدم وكلمة المرور.'
          : 'Please enter your username and password.';

      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.http.post<LoginResponse>(this.apiUrl, {
      username: this.username.trim(),
      password: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        localStorage.setItem('managerToken', response.token);
        localStorage.setItem('manager', JSON.stringify(response.manager));

        this.cdr.markForCheck();

        this.router.navigate(['/manager/dashboard']);
      },

      error: (error) => {
        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'اسم المستخدم أو كلمة المرور غير صحيحة.'
            : 'Invalid username or password.');

        this.cdr.markForCheck();
      }
    });
  }
}
