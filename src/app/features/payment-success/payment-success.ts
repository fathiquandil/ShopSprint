
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Order } from '../../core/services/order';
import { CartService } from '../../core/services/cart';
import { FavoriteService } from '../../core/services/favorite';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="payment-result">
      <div class="result-card">

        <div *ngIf="isLoading">
          <h2>Verifying your payment...</h2>
          <p>Please wait while we confirm your payment.</p>
        </div>

        <div *ngIf="isSuccess">
          <h1>Payment Successful!</h1>
          <p>Your order has been paid successfully.</p>
          <a routerLink="/">Continue Shopping</a>
        </div>

        <div *ngIf="errorMessage">
          <h1>Payment Not Confirmed</h1>
          <p>{{ errorMessage }}</p>
          <a routerLink="/">Return to Home</a>
        </div>

      </div>
    </main>
  `,
  styles: [`
    .payment-result {
      min-height: 70vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
    }

    .result-card {
      width: 100%;
      max-width: 500px;
      padding: 40px 24px;
      text-align: center;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    h1 {
      color: #15803d;
    }

    a {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      background: #f59e0b;
      color: #111827;
      text-decoration: none;
    }
  `]
})
export class PaymentSuccess implements OnInit {

  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: Order,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.isLoading = false;
      this.errorMessage = 'The payment session ID is missing.';
      return;
    }

    this.orderService.verifyCheckoutSession(sessionId).subscribe({
      next: (response) => {
        if (!response.paid) {
          this.isLoading = false;
          this.errorMessage = 'We could not confirm your payment.';
          this.cdr.detectChanges();
          return;
        }

        // Remove only the products included in the confirmed order.
        response.items.forEach((orderItem) => {
          this.cartService.removeFromCart(orderItem.itemId);
          this.favoriteService.removeFromFavorites(orderItem.itemId);
        });

        this.isLoading = false;
        this.isSuccess = true;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Payment verification failed:', error);

        this.isLoading = false;
        this.errorMessage =
          'We could not verify your payment right now. Your cart and favorites have been kept unchanged.';

        this.cdr.detectChanges();
      }
    });
  }
}
