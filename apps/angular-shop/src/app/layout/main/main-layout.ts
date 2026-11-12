import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoriesService } from '../../services/categories.service';
import { CategoryResponseDto } from '@fpm/contracts';
import { HttpErrorResponse } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../pages/cart/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    NgbCollapseModule,
    NgbDropdownModule,
    TitleCasePipe
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  protected readonly categoriesService = inject(CategoriesService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly categories = signal<CategoryResponseDto[]>([]);
  protected readonly cartItemCount = signal(0);
  protected readonly isAuthenticated = this.authService.isConnected;
  protected readonly screenReaderText = computed(() => {
    const itemCount = this.cartService.totalItems();
    if (itemCount === 0) {
      return 'Votre panier est tristement vide';
    }
    const itemText = itemCount === 1 ? 'article' : 'articles';
    return `${itemCount} ${itemText} dans le panier`;
  });


  protected isMenuCollapsed = true;

  ngOnInit(): void {
    this.getAllCategories();
  }

  protected logout(): void {
    this.isMenuCollapsed = true;
    this.authService.logout().subscribe({
      // Même si l'API échoue, l'utilisateur quitte les pages protégées.
      complete: () => this.router.navigateByUrl('/home'),
      error: () => this.router.navigateByUrl('/home')
    });
  }

  getAllCategories() {
    return this.categoriesService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
        error: (error: HttpErrorResponse) => {
        console.error(error)}
      })
    }
}
