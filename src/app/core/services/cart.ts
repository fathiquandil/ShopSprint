
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Item } from './item';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // اسم التخزين داخل LocalStorage
  private cartKey = 'shop_cart';

  // متابعة عدد المنتجات في السلة
  private cartCountSubject = new BehaviorSubject<number>(
    this.getCartCount()
  );

  // إتاحة متابعة العدد للصفحات الأخرى
  cartCount$ = this.cartCountSubject.asObservable();

  // جلب المنتجات الموجودة في السلة
  getCart(): Item[] {
    const cart = localStorage.getItem(this.cartKey);

    return cart ? JSON.parse(cart) : [];
  }

  // تحديث عدد المنتجات
  private updateCartCount(): void {
    this.cartCountSubject.next(this.getCartCount());
  }

  // إضافة منتج للسلة
  addToCart(item: Item): void {

    const cart = this.getCart();

    // التأكد إن المنتج مش موجود بالفعل
    const exists = cart.find(product => product._id === item._id);

    if (!exists) {
      cart.push(item);
    }

    // حفظ السلة في LocalStorage
    localStorage.setItem(this.cartKey, JSON.stringify(cart));

    // تحديث العداد فورًا
    this.updateCartCount();
  }

  // حذف منتج من السلة
  removeFromCart(itemId: string): void {

    const cart = this.getCart();

    const updatedCart = cart.filter(
      item => item._id !== itemId
    );

    localStorage.setItem(this.cartKey, JSON.stringify(updatedCart));

    // تحديث العداد فورًا
    this.updateCartCount();
  }

  // إفراغ السلة
  clearCart(): void {
    localStorage.removeItem(this.cartKey);

    // تحديث العداد إلى صفر
    this.updateCartCount();
  }

  // حساب عدد المنتجات في السلة
  getCartCount(): number {
    return this.getCart().length;
  }
}
