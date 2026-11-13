
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { FavoriteService } from '../../core/services/favorite';
import { CartService } from '../../core/services/cart';
import { Item } from '../../core/services/item';
import { LanguageService, Language } from '../../core/services/language';

@Component({
  selector: 'app-favorites',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites implements OnInit {

  favoriteItems: Item[] = [];

  currentLanguage: Language = 'en';

  constructor(
    private favoriteService: FavoriteService,
    private cartService: CartService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // تحديد اللغة الحالية
    this.currentLanguage = this.languageService.currentLanguage;

    // متابعة تغيير اللغة من الهيدر
    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    this.loadFavorites();
  }

  // جلب المنتجات المفضلة
  loadFavorites(): void {
    this.favoriteItems = this.favoriteService.getFavorites();
    this.cdr.markForCheck();
  }

  // حذف منتج من المفضلة
  removeFavorite(itemId: string): void {
    this.favoriteService.removeFromFavorites(itemId);
    this.loadFavorites();
  }

  // إضافة منتج للسلة
  addToCart(item: Item): void {
    this.cartService.addToCart(item);
    this.cdr.detectChanges();
  }
}
