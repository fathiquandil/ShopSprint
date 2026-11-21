
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { Item } from '../../core/services/item';
import { RouterLink } from '@angular/router';
import { LanguageService, Language } from '../../core/services/language';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {

  cartItems: Item[] = [];
  currentLanguage: Language = 'en';

  constructor(
    private cartService: CartService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    this.loadCart();
  }

  // جلب المنتجات من السلة
  loadCart(): void {
    this.cartItems = this.cartService.getCart();
    this.cdr.markForCheck();
  }

  // حذف منتج من السلة
  removeItem(itemId: string): void {
    this.cartService.removeFromCart(itemId);
    this.loadCart();
  }

  // حساب إجمالي الأسعار
  getTotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price,
      0
    );
  }
}
