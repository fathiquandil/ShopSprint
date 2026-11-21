
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LanguageService, Language } from '../../../core/services/language';

interface OrderItem {
  item: string | {
    _id: string;
    name: {
      en: string;
      ar: string;
    };
    price: number;
    image: string;
  };
  name: {
    en: string;
    ar: string;
  };
  image: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    city: string;
    street: string;
    details: string;
  };
  items: OrderItem[];
  totalPrice: number;
  notes: string;
  paymentMethod: 'cash_on_delivery' | 'stripe';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  createdAt: string;
}

interface OrderResponse {
  message: string;
  order: Order;
}

@Component({
  selector: 'app-manager-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {
  private apiUrl = 'http://localhost:3000/api/orders';

  orders: Order[] = [];

  currentLanguage: Language = 'en';

  isLoading = false;
  isUpdating = false;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';

  selectedOrder: Order | null = null;

  readonly statusTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  };

  constructor(
    private http: HttpClient,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.markForCheck();
    });

    this.loadOrders();
  }

  // Manager authorization headers
  private getManagerHeaders(): HttpHeaders {
    const token = localStorage.getItem('managerToken');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Load all orders
  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Order[]>(
      this.apiUrl,
      { headers: this.getManagerHeaders() }
    ).subscribe({
      next: response => {
        this.orders = response;
        this.isLoading = false;

        if (this.selectedOrder) {
          this.selectedOrder =
            this.orders.find(order => order._id === this.selectedOrder?._id) || null;
        }

        this.cdr.markForCheck();
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Failed to load orders.';
        this.cdr.markForCheck();
      }
    });
  }

  // Filter orders by ID, customer name or phone
  get filteredOrders(): Order[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.orders;
    }

    return this.orders.filter(order =>
      order._id.toLowerCase().includes(search) ||
      order.customer.name.toLowerCase().includes(search) ||
      order.customer.phone.toLowerCase().includes(search) ||
      order.customer.email.toLowerCase().includes(search)
    );
  }

  // Select an order to show its details
  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Close order details
  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  // Get allowed next statuses for an order
  getAvailableStatuses(order: Order): string[] {
    const statuses = this.statusTransitions[order.status] || [];

    if (
      order.paymentMethod === 'stripe' &&
      order.paymentStatus !== 'paid'
    ) {
      return statuses.filter(status => status !== 'confirmed');
    }

    return statuses;
  }

  // Update order status
  updateOrderStatus(order: Order, newStatus: string): void {
    if (!this.getAvailableStatuses(order).includes(newStatus)) {
      return;
    }

    const confirmed = window.confirm(
      this.currentLanguage === 'ar'
        ? `هل أنت متأكد من تغيير حالة الطلب إلى ${this.getStatusLabel(newStatus)}؟`
        : `Are you sure you want to change the order status to ${newStatus}?`
    );

    if (!confirmed) {
      return;
    }

    this.isUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.patch<OrderResponse>(
      `${this.apiUrl}/${order._id}/status`,
      { status: newStatus },
      { headers: this.getManagerHeaders() }
    ).subscribe({
      next: response => {
        this.isUpdating = false;
        this.successMessage = response.message;

        this.loadOrders();
        this.cdr.markForCheck();
      },
      error: error => {
        this.isUpdating = false;
        this.errorMessage =
          error.error?.message ||
          (this.currentLanguage === 'ar'
            ? 'حدث خطأ أثناء تحديث حالة الطلب.'
            : 'Failed to update order status.');

        this.cdr.markForCheck();
      }
    });
  }

  // Translate order status
  getStatusLabel(status: string): string {
    if (this.currentLanguage === 'ar') {
      const labels: Record<string, string> = {
        pending: 'قيد الانتظار',
        confirmed: 'تم التأكيد',
        processing: 'قيد التجهيز',
        shipped: 'تم الشحن',
        delivered: 'تم التسليم',
        cancelled: 'ملغي'
      };

      return labels[status] || status;
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Translate payment method
  getPaymentMethodLabel(method: string): string {
    if (this.currentLanguage === 'ar') {
      return method === 'stripe' ? 'بطاقة بنكية' : 'الدفع عند الاستلام';
    }

    return method === 'stripe' ? 'Stripe' : 'Cash on Delivery';
  }

  // Translate payment status
  getPaymentStatusLabel(status: string): string {
    if (this.currentLanguage === 'ar') {
      const labels: Record<string, string> = {
        unpaid: 'غير مدفوع',
        pending: 'قيد الدفع',
        paid: 'مدفوع',
        refunded: 'تم استرداده'
      };

      return labels[status] || status;
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Format order date
  formatDate(date: string): string {
    return new Date(date).toLocaleString(
      this.currentLanguage === 'ar' ? 'ar-EG' : 'en-US'
    );
  }

  // Toggle application language
  toggleLanguage(): void {
    const newLanguage =
      this.currentLanguage === 'en' ? 'ar' : 'en';

    this.languageService.setLanguage(newLanguage);
  }
}
