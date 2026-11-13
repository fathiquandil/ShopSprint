
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateOrderData {
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

  items: {
    item: string;
    quantity: number;
  }[];

  notes: string;
  paymentMethod: 'cash_on_delivery' | 'stripe';
}

export interface OrderResponse {
  message: string;
  order: {
    _id: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
  };
}

export interface CheckoutSessionResponse {
  message: string;
  sessionId: string;
  clientSecret: string;
}

// Response returned after verifying Stripe payment
export interface VerifyPaymentResponse {
  paid: boolean;
  orderId: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class Order {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) {}

  // Create a new order
  createOrder(orderData: CreateOrderData): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      this.apiUrl,
      orderData
    );
  }

  // Create Stripe Checkout Session
  createCheckoutSession(orderId: string): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/checkout-session`,
      { orderId }
    );
  }

  // Verify successful Stripe payment
  verifyCheckoutSession(sessionId: string): Observable<VerifyPaymentResponse> {
    return this.http.get<VerifyPaymentResponse>(
      `${this.apiUrl}/verify-payment/${encodeURIComponent(sessionId)}`
    );
  }
}

