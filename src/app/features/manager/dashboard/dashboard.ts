
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService, Language } from '../../../core/services/language';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  currentLanguage: Language = 'en';

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
    });
  }

  toggleLanguage(): void {
    const newLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(newLanguage);
  }

  logout(): void {
    localStorage.removeItem('managerToken');
    localStorage.removeItem('manager');

    this.router.navigate(['/manager/login']);
  }
}
