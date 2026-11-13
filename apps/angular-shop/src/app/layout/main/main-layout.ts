import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBar } from './top-bar/top-bar';
import { CategoryNav } from './category-nav/category-nav';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet, TopBar, CategoryNav],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css',
})
export class MainLayout {
    /** Le burger (TopBar) ouvre et ferme les catégories (CategoryNav) sur mobile. */
    protected menuOpen = signal(false);
}
