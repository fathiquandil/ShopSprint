import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LanguageService, Language } from '../../../core/services/language';
interface Category {
  _id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
}

interface CategoryResponse {
  message: string;
  category: Category;
}

@Component({
  selector: 'app-manager-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories {
  private apiUrl = 'http://localhost:3000/api/categories';

  categories: Category[] = [];

  currentLanguage: Language = 'en';

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  editingCategoryId: string | null = null;

  form = {
    name: {
      en: '',
      ar: ''
    },
    description: {
      en: '',
      ar: ''
    }
  };

  constructor(
    private http: HttpClient,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.markForCheck();
    });

    this.loadCategories();
  }

  // Get all categories
  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Category[]>(this.apiUrl).subscribe({
      next: (response) => {
        this.categories = response;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Failed to load categories.';
        this.cdr.markForCheck();
      }
    });
  }

  // Get manager authorization headers
  private getManagerHeaders(): HttpHeaders {
    const token = localStorage.getItem('managerToken');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Add or update category
  saveCategory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const { name, description } = this.form;

    if (
      !name.en.trim() ||
      !name.ar.trim() ||
      !description.en.trim() ||
      !description.ar.trim()
    ) {
      this.errorMessage =
        this.currentLanguage === 'ar'
          ? 'من فضلك أدخل اسم ووصف القسم باللغتين.'
          : 'Please enter the category name and description in both languages.';

      return;
    }

    this.isSaving = true;

    const request = this.editingCategoryId
      ? this.http.put<CategoryResponse>(
          `${this.apiUrl}/${this.editingCategoryId}`,
          this.form,
          { headers: this.getManagerHeaders() }
        )
      : this.http.post<CategoryResponse>(
          this.apiUrl,
          this.form,
          { headers: this.getManagerHeaders() }
        );

    request.subscribe({
      next: (response) => {
        this.isSaving = false;

        this.successMessage = response.message;

        this.resetForm();
        this.loadCategories();

        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSaving = false;

        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'حدث خطأ أثناء حفظ القسم.'
            : 'Failed to save category.');

        this.cdr.markForCheck();
      }
    });
  }

  // Prepare category data for editing
  editCategory(category: Category): void {
    this.editingCategoryId = category._id;

    this.form = {
      name: {
        en: category.name.en,
        ar: category.name.ar
      },
      description: {
        en: category.description.en,
        ar: category.description.ar
      }
    };

    this.errorMessage = '';
    this.successMessage = '';
  }

  // Delete category
  deleteCategory(id: string): void {
    const confirmed = window.confirm(
      this.currentLanguage === 'ar'
        ? 'هل أنت متأكد من حذف هذا القسم؟'
        : 'Are you sure you want to delete this category?'
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getManagerHeaders() }
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadCategories();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'حدث خطأ أثناء حذف القسم.'
            : 'Failed to delete category.');

        this.cdr.markForCheck();
      }
    });
  }

  // Reset the form
  resetForm(): void {
    this.editingCategoryId = null;

    this.form = {
      name: {
        en: '',
        ar: ''
      },
      description: {
        en: '',
        ar: ''
      }
    };
  }

  // Change application language
  toggleLanguage(): void {
    const newLanguage =
      this.currentLanguage === 'en' ? 'ar' : 'en';

    this.languageService.setLanguage(newLanguage);
  }
}
