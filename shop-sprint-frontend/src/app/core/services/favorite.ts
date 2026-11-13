
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Item } from './item';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  // اسم التخزين داخل LocalStorage
  private favoriteKey = 'shop_favorites';

  // متابعة عدد المنتجات المفضلة
  private favoriteCountSubject = new BehaviorSubject<number>(
    this.getFavoritesCount()
  );

  // إتاحة متابعة العدد للصفحات الأخرى
  favoriteCount$ = this.favoriteCountSubject.asObservable();

  // جلب المنتجات المفضلة
  getFavorites(): Item[] {
    const favorites = localStorage.getItem(this.favoriteKey);

    return favorites ? JSON.parse(favorites) : [];
  }

  // تحديث عدد المنتجات المفضلة
  private updateFavoritesCount(): void {
    this.favoriteCountSubject.next(this.getFavoritesCount());
  }

  // إضافة منتج للمفضلة
  addToFavorites(item: Item): void {

    const favorites = this.getFavorites();

    const exists = favorites.find(
      product => product._id === item._id
    );

    if (!exists) {
      favorites.push(item);
    }

    localStorage.setItem(
      this.favoriteKey,
      JSON.stringify(favorites)
    );

    // تحديث العداد فورًا
    this.updateFavoritesCount();
  }

  // حذف منتج من المفضلة
  removeFromFavorites(itemId: string): void {

    const favorites = this.getFavorites();

    const updatedFavorites = favorites.filter(
      item => item._id !== itemId
    );

    localStorage.setItem(
      this.favoriteKey,
      JSON.stringify(updatedFavorites)
    );

    // تحديث العداد فورًا
    this.updateFavoritesCount();
  }

  // التأكد هل المنتج موجود في المفضلة
  isFavorite(itemId: string): boolean {
    return this.getFavorites().some(
      item => item._id === itemId
    );
  }

  // إفراغ المفضلة
  clearFavorites(): void {
    localStorage.removeItem(this.favoriteKey);

    // تحديث العداد إلى صفر
    this.updateFavoritesCount();
  }

  // حساب عدد المنتجات المفضلة
  getFavoritesCount(): number {
    return this.getFavorites().length;
  }
}
