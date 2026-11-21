
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  loadStripe,
  StripeEmbeddedCheckout
} from '@stripe/stripe-js';

import { environment } from '../../../environments/environment';

import { CartService } from '../../core/services/cart';
import { FavoriteService } from '../../core/services/favorite';
import { Item } from '../../core/services/item';
import { Order, CreateOrderData } from '../../core/services/order';
import { LanguageService, Language } from '../../core/services/language';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, OnDestroy {

  @ViewChild('stripeCheckoutContainer')
  stripeCheckoutContainer?: ElementRef<HTMLDivElement>;

  cartItems: Item[] = [];

  currentLanguage: Language = 'en';

  customer = {
    name: '',
    email: '',
    phone: ''
  };

  address = {
    city: '',
    street: '',
    details: ''
  };

  notes = '';

  selectedPaymentMethod: 'cash_on_delivery' | 'stripe' =
    'cash_on_delivery';

  isSubmitting = false;
  showStripeCheckout = false;

  errorMessage = '';
  successMessage = '';
  orderId = '';

  private embeddedCheckout: StripeEmbeddedCheckout | null = null;

  constructor(
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private orderService: Order,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentLanguage = this.languageService.currentLanguage;

    this.languageService.language$.subscribe(language => {
      this.currentLanguage = language;
      this.cdr.detectChanges();
    });

    this.cartItems = this.cartService.getCart();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.embeddedCheckout?.destroy();
    this.embeddedCheckout = null;
  }

  getTotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price,
      0
    );
  }

  placeOrder(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isSubmitting) return;

    if (this.cartItems.length === 0) {
      this.errorMessage = this.currentLanguage === 'en'
        ? 'Your cart is empty.'
        : 'سلة التسوق فارغة.';
      return;
    }

    if (
      !this.customer.name.trim() ||
      !this.customer.phone.trim() ||
      !this.address.city.trim() ||
      !this.address.street.trim()
    ) {
      this.errorMessage = this.currentLanguage === 'en'
        ? 'Please fill in all required fields.'
        : 'من فضلك أكمل جميع الحقول المطلوبة.';
      return;
    }

    if (
      this.customer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customer.email.trim())
    ) {
      this.errorMessage = this.currentLanguage === 'en'
        ? 'Please enter a valid email address.'
        : 'من فضلك أدخل بريدًا إلكترونيًا صحيحًا.';
      return;
    }

    const orderData: CreateOrderData = {
      customer: {
        name: this.customer.name.trim(),
        email: this.customer.email.trim(),
        phone: this.customer.phone.trim()
      },
      address: {
        city: this.address.city.trim(),
        street: this.address.street.trim(),
        details: this.address.details.trim()
      },
      items: this.cartItems.map(item => ({
        item: item._id,
        quantity: 1
      })),
      notes: this.notes.trim(),
      paymentMethod: this.selectedPaymentMethod
    };

    this.isSubmitting = true;

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.orderId = response.order._id;

        // Cash on Delivery
        if (this.selectedPaymentMethod === 'cash_on_delivery') {
          // حذف المنتجات التي تم شراؤها من المفضلة فقط
          this.cartItems.forEach(item => {
            this.favoriteService.removeFromFavorites(item._id);
          });

          // إفراغ السلة بعد نجاح إنشاء الطلب
          this.cartService.clearCart();
          this.cartItems = [];

          this.successMessage = this.currentLanguage === 'en'
            ? 'Your order has been placed successfully!'
            : 'تم تسجيل طلبك بنجاح!';

          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }

        // Stripe Embedded Checkout
        this.orderService.createCheckoutSession(this.orderId).subscribe({
          next: (session) => {
            if (!session.clientSecret) {
              this.errorMessage = this.currentLanguage === 'en'
                ? 'Unable to get the Stripe checkout information.'
                : 'تعذر الحصول على بيانات الدفع من Stripe.';

              this.isSubmitting = false;
              this.cdr.markForCheck();
              return;
            }

            this.mountStripeCheckout(session.clientSecret);
          },

          error: (error) => {
            console.error('Stripe Session Error:', error);

            this.errorMessage = error.error?.message ||
              (this.currentLanguage === 'en'
                ? 'Failed to start the payment process. Please try again.'
                : 'فشل بدء عملية الدفع. حاول مرة أخرى.');

            this.isSubmitting = false;
            this.cdr.markForCheck();
          }
        });
      },

      error: (error) => {
        console.error('Create Order Error:', error);

        this.errorMessage = error.error?.message ||
          (this.currentLanguage === 'en'
            ? 'Failed to place your order. Please try again.'
            : 'فشل تسجيل الطلب. حاول مرة أخرى.');

        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  private async mountStripeCheckout(clientSecret: string): Promise<void> {
    try {
      this.showStripeCheckout = true;
      this.cdr.detectChanges();

      const container = this.stripeCheckoutContainer?.nativeElement;

      if (!container) {
        throw new Error('Stripe checkout container was not found.');
      }

      const stripe = await loadStripe(
        environment.stripePublishableKey
      );

      if (!stripe) {
        throw new Error('Stripe could not be initialized.');
      }

      const checkout = await stripe.createEmbeddedCheckoutPage({
        clientSecret
      });

      checkout.mount(container);

      this.embeddedCheckout = checkout;

      this.isSubmitting = false;
      this.cdr.markForCheck();

    } catch (error) {
      console.error('Embedded Checkout Error:', error);

      this.errorMessage = this.currentLanguage === 'en'
        ? 'Unable to load the payment form. Please try again.'
        : 'تعذر تحميل نموذج الدفع. حاول مرة أخرى.';

      this.showStripeCheckout = false;
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
