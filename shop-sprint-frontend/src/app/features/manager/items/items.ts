
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

interface Item {
  _id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  price: number;
  quantity: number;
  image: string;
  category: Category;
}

interface ItemResponse {
  message: string;
  item: Item;
}

@Component({
  selector: 'app-manager-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './items.html',
  styleUrl: './items.css'
})
export class Items {
  private itemsApiUrl = 'http://localhost:3000/api/items';
  private categoriesApiUrl = 'http://localhost:3000/api/categories';

  items: Item[] = [];
  categories: Category[] = [];

  currentLanguage: Language = 'en';

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  editingItemId: string | null = null;

  searchTerm = '';

  form = {
    name: {
      en: '',
      ar: ''
    },
    description: {
      en: '',
      ar: ''
    },
    price: 0,
    quantity: 0,
    image: '',
    category: ''
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
    this.loadItems();
  }

  // Filter items by name or category
  get filteredItems(): Item[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.items;
    }

    return this.items.filter(item =>
      item.name.en.toLowerCase().includes(search) ||
      item.name.ar.toLowerCase().includes(search) ||
      item.category?.name.en.toLowerCase().includes(search) ||
      item.category?.name.ar.toLowerCase().includes(search)
    );
  }

  // Manager authorization headers
  private getManagerHeaders(): HttpHeaders {
    const token = localStorage.getItem('managerToken');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Load all categories
  loadCategories(): void {
    this.http.get<Category[]>(this.categoriesApiUrl).subscribe({
      next: response => {
        this.categories = response;
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Failed to load categories.';
        this.cdr.markForCheck();
      }
    });
  }

  // Load all items
  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Item[]>(
      this.itemsApiUrl,
      { headers: this.getManagerHeaders() }
    ).subscribe({
      next: response => {
        this.items = response;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Failed to load items.';
        this.cdr.markForCheck();
      }
    });
  }

  // Add or update item
  saveItem(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const { name, description, price, quantity, image, category } = this.form;

    if (
      !name.en.trim() ||
      !name.ar.trim() ||
      !description.en.trim() ||
      !description.ar.trim() ||
      !image.trim() ||
      !category
    ) {
      this.errorMessage =
        this.currentLanguage === 'ar'
          ? 'من فضلك أكمل جميع الحقول.'
          : 'Please fill in all fields.';

      return;
    }

    if (
      !Number.isFinite(Number(price)) ||
      !Number.isFinite(Number(quantity)) ||
      Number(price) < 0 ||
      Number(quantity) < 0
    ) {
      this.errorMessage =
        this.currentLanguage === 'ar'
          ? 'السعر والكمية يجب أن يكونا أرقامًا صحيحة غير سالبة.'
          : 'Price and quantity must be valid non-negative numbers.';

      return;
    }

    const itemData = {
      name: {
        en: name.en.trim(),
        ar: name.ar.trim()
      },
      description: {
        en: description.en.trim(),
        ar: description.ar.trim()
      },
      price: Number(price),
      quantity: Number(quantity),
      image: image.trim(),
      category
    };

    this.isSaving = true;

    const request = this.editingItemId
      ? this.http.put<ItemResponse>(
          `${this.itemsApiUrl}/${this.editingItemId}`,
          itemData,
          { headers: this.getManagerHeaders() }
        )
      : this.http.post<ItemResponse>(
          this.itemsApiUrl,
          itemData,
          { headers: this.getManagerHeaders() }
        );

    request.subscribe({
      next: response => {
        this.isSaving = false;
        this.successMessage = response.message;

        this.resetForm();
        this.loadItems();

        this.cdr.markForCheck();
      },
      error: error => {
        this.isSaving = false;

        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'حدث خطأ أثناء حفظ المنتج.'
            : 'Failed to save item.');

        this.cdr.markForCheck();
      }
    });
  }

  // Prepare item data for editing
  editItem(item: Item): void {
    this.editingItemId = item._id;

    this.form = {
      name: {
        en: item.name.en,
        ar: item.name.ar
      },
      description: {
        en: item.description.en,
        ar: item.description.ar
      },
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category?._id || ''
    };

    this.errorMessage = '';
    this.successMessage = '';
  }

  // Delete item
  deleteItem(id: string): void {
    const confirmed = window.confirm(
      this.currentLanguage === 'ar'
        ? 'هل أنت متأكد من حذف هذا المنتج؟'
        : 'Are you sure you want to delete this item?'
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete<{ message: string }>(
      `${this.itemsApiUrl}/${id}`,
      { headers: this.getManagerHeaders() }
    ).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.loadItems();
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'حدث خطأ أثناء حذف المنتج.'
            : 'Failed to delete item.');

        this.cdr.markForCheck();
      }
    });
  }

  // Reset the form
  resetForm(): void {
    this.editingItemId = null;

    this.form = {
      name: {
        en: '',
        ar: ''
      },
      description: {
        en: '',
        ar: ''
      },
      price: 0,
      quantity: 0,
      image: '',
      category: ''
    };
  }

  // Get category name based on current language
  getCategoryName(category: Category): string {
    return category?.name?.[this.currentLanguage] ||
      category?.name?.en || '';
  }

  // Toggle application language
  toggleLanguage(): void {
    const newLanguage =
      this.currentLanguage === 'en' ? 'ar' : 'en';

    this.languageService.setLanguage(newLanguage);
  }
}
