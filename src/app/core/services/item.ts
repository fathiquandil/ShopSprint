import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// النصوص متعددة اللغات
export interface LocalizedText {
  en: string;
  ar: string;
}

// بيانات القسم المرتبط بالمنتج
export interface ItemCategory {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
}

// شكل بيانات المنتج القادمة من Backend
export interface Item {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  quantity?: number;
  image?: string;
  category: ItemCategory;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  // عنوان API الخاص بالمنتجات
  private apiUrl = 'http://localhost:3000/api/items';

  // استقبال HttpClient لإرسال طلبات للـ Backend
  constructor(private http: HttpClient) {}

  // جلب منتج واحد باستخدام ID
  getItemById(id: string): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  // جلب جميع المنتجات
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiUrl);
  }
}
