import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './shared/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('shop-sprint-frontend');

  private managerRoute = signal(false);

  constructor(private router: Router) {
    this.checkRoute();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.checkRoute();
      });
  }

  isManagerRoute(): boolean {
    return this.managerRoute();
  }

  private checkRoute(): void {
    this.managerRoute.set(
      this.router.url.startsWith('/manager')
    );
  }
}
