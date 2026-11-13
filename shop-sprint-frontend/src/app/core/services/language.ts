
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private languageSubject = new BehaviorSubject<Language>(
    this.getSavedLanguage()
  );

  language$ = this.languageSubject.asObservable();

  constructor() {
    this.applyLanguage(this.currentLanguage);
  }

  get currentLanguage(): Language {
    return this.languageSubject.value;
  }

  setLanguage(language: Language): void {
    localStorage.setItem('shop_language', language);

    this.languageSubject.next(language);

    this.applyLanguage(language);
  }

  private getSavedLanguage(): Language {
    const savedLanguage = localStorage.getItem('shop_language');

    return savedLanguage === 'ar' ? 'ar' : 'en';
  }

  private applyLanguage(language: Language): void {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
