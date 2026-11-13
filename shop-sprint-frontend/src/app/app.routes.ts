
import { Routes } from '@angular/router';

// Home Page
import { Home } from './features/home/home';

// Product Details Page
import { ProductDetails } from './features/products/product-details/product-details';

// Category Products Page
import { CategoryProducts } from './features/category/category-products/category-products';

// Cart Page
import { Cart } from './features/cart/cart';

// Favorites Page
import { Favorites } from './features/favorites/favorites';

// Checkout Page
import { Checkout } from './features/checkout/checkout';

// Manager Pages
import { Login } from './features/manager/login/login';
import { Dashboard } from './features/manager/dashboard/dashboard';
import { Categories } from './features/manager/categories/categories';
import { Items } from './features/manager/items/items';
import { Orders } from './features/manager/orders/orders';

import { PaymentSuccess } from './features/payment-success/payment-success';
export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'category/:id',
    component: CategoryProducts
  },
  {
    path: 'item/:id',
    component: ProductDetails
  },
  {
    path: 'cart',
    component: Cart
  },
  {
    path: 'favorites',
    component: Favorites
  },
  {
    path: 'checkout',
    component: Checkout
  },
  {
    path: 'payment-success',
    component: PaymentSuccess

  },
  {
    path: 'manager/login',
    component: Login
  },
  {
    path: 'manager/dashboard',
    component: Dashboard
  },
  {
    path: 'manager/categories',
    component: Categories
  },
  { path: 'manager/items', component: Items },
  { path: 'manager/orders', component: Orders }
];
