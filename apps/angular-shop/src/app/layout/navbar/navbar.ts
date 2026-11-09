import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoriesService } from '../../services/categories.service';
import { CategoryResponseDto } from '@fpm/contracts';
import { HttpErrorResponse } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    NgbCollapseModule,
    NgbDropdownModule,
    TitleCasePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  protected readonly categoriesService = inject(CategoriesService);

  protected readonly categories = signal<CategoryResponseDto[]>([]);
  protected readonly cartItemCount = signal(0);
  // Provisoire : à brancher sur l'authentification quand elle existera.
  protected readonly isAuthenticated = signal(false);
  protected isMenuCollapsed = true;

  ngOnInit(): void {
    this.getAllCategories();
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
