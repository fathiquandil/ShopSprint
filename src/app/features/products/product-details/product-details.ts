
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { ItemService, Item } from '../../../core/services/item';
import { CartService } from '../../../core/services/cart';
import { FavoriteService } from '../../../core/services/favorite';
import { LanguageService, Language } from '../../../core/services/language';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css'
})
export class ProductDetails implements OnInit {

  item: Item | null = null;

  isLoading = true;
  errorMessage = '';
  successMessage = '';
  favoriteMessage = '';

  currentLanguage: Language = 'en';

  constructor(
    private route: ActivatedRoute,
    private itemService: ItemService,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.itemService.getItemById(id).subscribe({

        next: (data) => {
          this.item = data;
          this.isLoading = false;

          this.cdr.markForCheck();
        },

        error: (error) => {
          this.errorMessage =
            this.currentLanguage === 'ar'
              ? 'فشل تحميل تفاصيل المنتج.'
              : 'Failed to load product details.';

          this.isLoading = false;

          console.error('Error:', error);

          this.cdr.markForCheck();
        }

      });

    } else {
      this.errorMessage =
        this.currentLanguage === 'ar'
          ? 'رقم المنتج غير موجود.'
          : 'Product ID not found.';

      this.isLoading = false;

      this.cdr.markForCheck();
    }
  }

  // Get product name according to selected language
  get productName(): string {
    if (!this.item) return '';

    return this.currentLanguage === 'ar'
      ? this.item.name?.ar || this.item.name?.en || ''
      : this.item.name?.en || this.item.name?.ar || '';
  }

  // Get product description according to selected language
  get productDescription(): string {
    if (!this.item) return '';

    return this.currentLanguage === 'ar'
      ? this.item.description?.ar || this.item.description?.en || ''
      : this.item.description?.en || this.item.description?.ar || '';
  }

  // Get category name according to selected language
  get categoryName(): string {
    if (!this.item) return '';

    const name = this.item.category?.name;

    if (!name) {
      return this.currentLanguage === 'ar' ? 'بدون تصنيف' : 'Uncategorized';
    }

    return this.currentLanguage === 'ar'
      ? name.ar || name.en || ''
      : name.en || name.ar || '';
  }

  // Add product to cart
  addToCart(): void {

    if (this.item) {

      this.cartService.addToCart(this.item);

      this.successMessage =
        this.currentLanguage === 'ar'
          ? 'تمت إضافة المنتج إلى السلة بنجاح!'
          : 'Product added to cart successfully!';

      this.favoriteMessage = '';

      this.cdr.markForCheck();
    }
  }

  // Add product to favorites
  addToFavorites(): void {

    if (this.item) {

      this.favoriteService.addToFavorites(this.item);

      this.favoriteMessage =
        this.currentLanguage === 'ar'
          ? 'تمت إضافة المنتج إلى المفضلة بنجاح!'
          : 'Product added to favorites successfully!';

      this.successMessage = '';

      this.cdr.markForCheck();
    }
  }
}
