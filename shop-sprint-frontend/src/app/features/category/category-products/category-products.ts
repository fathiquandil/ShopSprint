
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { ItemService, Item } from '../../../core/services/item';
import { Category, CategoryItem } from '../../../core/services/category';
import { CartService } from '../../../core/services/cart';
import { FavoriteService } from '../../../core/services/favorite';
import { LanguageService, Language } from '../../../core/services/language';

@Component({
  selector: 'app-category-products',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './category-products.html',
  styleUrl: './category-products.css',
})
export class CategoryProducts implements OnInit {

  category: CategoryItem | null = null;

  items: Item[] = [];

  searchTerm = '';

  isLoading = true;
  errorMessage = '';

  categoryNotFound = false;

  currentLanguage: Language = 'en';

  constructor(
    private route: ActivatedRoute,
    private itemService: ItemService,
    private categoryService: Category,
    private cartService: CartService,
    public favoriteService: FavoriteService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // تحديد اللغة الحالية
    this.currentLanguage = this.languageService.currentLanguage;

    // متابعة أي تغيير في اللغة
    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    // استقبال رقم القسم من الرابط
    this.route.paramMap.subscribe(params => {
      const categoryId = params.get('id');

      if (categoryId) {
        this.loadCategory(categoryId);
      }
    });

    // استقبال كلمة البحث من الهيدر
    this.route.queryParamMap.subscribe(params => {
      this.searchTerm = params.get('search') || '';
      this.cdr.markForCheck();
    });
  }

  // تحميل بيانات القسم
  loadCategory(categoryId: string): void {

    this.isLoading = true;
    this.categoryNotFound = false;
    this.errorMessage = '';
    this.category = null;
    this.items = [];

    this.categoryService.getCategories().subscribe({
      next: (categories) => {

        const foundCategory = categories.find(
          category => category._id === categoryId
        );

        if (!foundCategory) {
          this.categoryNotFound = true;
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.category = foundCategory;
        this.loadCategoryItems(categoryId);
      },

      error: (error) => {
        console.error('Error loading category:', error);

        this.errorMessage = 'Failed to load category.';
        this.isLoading = false;

        this.cdr.markForCheck();
      }
    });
  }

  // تحميل منتجات القسم الحالي فقط
  loadCategoryItems(categoryId: string): void {

    this.itemService.getItems().subscribe({
      next: (data) => {

        this.items = data.filter(
          item => item.category?._id === categoryId
        );

        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error loading category products:', error);

        this.errorMessage = 'Failed to load products.';
        this.isLoading = false;

        this.cdr.markForCheck();
      }
    });
  }

  // البحث داخل منتجات القسم باللغتين
  get filteredItems(): Item[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {

      const englishName = (item.name?.en || '').toLowerCase();
      const arabicName = (item.name?.ar || '').toLowerCase();

      const englishDescription =
        (item.description?.en || '').toLowerCase();

      const arabicDescription =
        (item.description?.ar || '').toLowerCase();

      return (
        !search ||
        englishName.includes(search) ||
        arabicName.includes(search) ||
        englishDescription.includes(search) ||
        arabicDescription.includes(search)
      );
    });
  }

  // إضافة أو حذف المنتج من المفضلة
  toggleFavorite(item: Item): void {

    if (this.favoriteService.isFavorite(item._id)) {
      this.favoriteService.removeFromFavorites(item._id);
    } else {
      this.favoriteService.addToFavorites(item);
    }

    this.cdr.detectChanges();
  }

  // إضافة المنتج إلى السلة
  addToCart(item: Item): void {

    this.cartService.addToCart(item);

    this.cdr.detectChanges();
  }
}
