import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [NgbCarouselModule],
  templateUrl: './about.html',
  styleUrl: './about'
})
export class About {}
