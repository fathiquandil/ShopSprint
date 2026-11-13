
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart';
import { FavoriteService } from '../../core/services/favorite';
import { Category, CategoryItem } from '../../core/services/category';
import { LanguageService, Language } from '../../core/services/language';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  cartCount = 0;
  favoriteCount = 0;

  categories: CategoryItem[] = [];

  searchTerm = '';

  currentLanguage: Language = 'en';

  constructor(
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private categoryService: Category,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef,
    public router: Router
  ) {}

  ngOnInit(): void {

    // قراءة العدد الحالي للسلة
    this.cartCount = this.cartService.getCartCount();

    // قراءة العدد الحالي للمفضلة
    this.favoriteCount = this.favoriteService.getFavoritesCount();

    // متابعة تغييرات عدد السلة
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
      this.cdr.detectChanges();
    });

    // متابعة تغييرات عدد المفضلة
    this.favoriteService.favoriteCount$.subscribe(count => {
      this.favoriteCount = count;
      this.cdr.detectChanges();
    });

    // تحديد اللغة الحالية
    this.currentLanguage = this.languageService.currentLanguage;

    // متابعة تغيير اللغة
    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    this.loadCategories();

    // متابعة كلمة البحث من الرابط
    this.router.routerState.root.queryParamMap.subscribe(params => {
      this.searchTerm = params.get('search') || '';
      this.cdr.detectChanges();
    });
  }

  // تحميل الأقسام من Backend
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.cdr.detectChanges();

        console.log('Categories loaded:', this.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  // تغيير اللغة
  toggleLanguage(): void {
    const newLanguage: Language =
      this.currentLanguage === 'en' ? 'ar' : 'en';

    this.languageService.setLanguage(newLanguage);
  }

  // استقبال نص البحث
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  // تنفيذ البحث
  searchProducts(): void {
    const currentPath = this.router.url.split('?')[0];
    const search = this.searchTerm.trim();

    const url = search
      ? `${currentPath}?search=${encodeURIComponent(search)}`
      : currentPath;

    this.router.navigateByUrl(url);
  }
}
