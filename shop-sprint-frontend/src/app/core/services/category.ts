
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface CategoryItem {
  _id: string;
  name: LocalizedText;
  description: LocalizedText;
}

@Injectable({
  providedIn: 'root',
})
export class Category {
  private apiUrl = 'http://localhost:3000/api/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(this.apiUrl);
  }
}
