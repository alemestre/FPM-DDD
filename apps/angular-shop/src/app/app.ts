import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';

@Component({
    imports: [
      Navbar,
      RouterModule],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected title = 'La Ferme du Petit Marais';
}
