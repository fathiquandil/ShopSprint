
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { CartService } from '../../core/services/cart';
import { FavoriteService } from '../../core/services/favorite';
import { ItemService, Item } from '../../core/services/item';
import { Category, CategoryItem } from '../../core/services/category';
import { LanguageService, Language } from '../../core/services/language';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  cartCount = 0;

  items: Item[] = [];
  categories: CategoryItem[] = [];

  searchTerm = '';

  isLoading = true;
  errorMessage = '';

  currentLanguage: Language = 'en';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    public favoriteService: FavoriteService,
    private itemService: ItemService,
    private categoryService: Category,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.getCartCount();

    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    this.loadItems();
    this.loadCategories();

    this.route.queryParamMap.subscribe(params => {
      this.searchTerm = params.get('search') || '';
      this.cdr.detectChanges();
    });
  }

  // Load products from Backend
  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading products:', error);

        this.errorMessage = 'Failed to load products.';
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  // Load categories from Backend
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  // Show all products
  filterByCategory(categoryId: string): void {
    this.searchTerm = '';
    this.router.navigateByUrl('/');
  }

  // Search products in both languages
  get filteredItems(): Item[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const englishName = (item.name?.en || '').toLowerCase();
      const arabicName = (item.name?.ar || '').toLowerCase();

      const englishDescription =
        (item.description?.en || '').toLowerCase();

      const arabicDescription =
        (item.description?.ar || '').toLowerCase();

      const englishCategory =
        (item.category?.name?.en || '').toLowerCase();

      const arabicCategory =
        (item.category?.name?.ar || '').toLowerCase();

      return (
        !search ||
        englishName.includes(search) ||
        arabicName.includes(search) ||
        englishDescription.includes(search) ||
        arabicDescription.includes(search) ||
        englishCategory.includes(search) ||
        arabicCategory.includes(search)
      );
    });
  }

  // Add or remove product from favorites
  toggleFavorite(item: Item): void {
    if (this.favoriteService.isFavorite(item._id)) {
      this.favoriteService.removeFromFavorites(item._id);
    } else {
      this.favoriteService.addToFavorites(item);
    }

    this.cdr.detectChanges();
  }

  // Add product to cart
  addToCart(item: Item): void {
    this.cartService.addToCart(item);
    this.cartCount = this.cartService.getCartCount();
    this.cdr.detectChanges();
  }
}
