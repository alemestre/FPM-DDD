import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
    imports: [
      RouterModule],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected title = 'La Ferme du Petit Marais';
}
