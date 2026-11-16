import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { Component } from '@angular/core';

@Component({
    selector: 'app-about',
    imports: [NgbCarouselModule],
    templateUrl: './about.html',
    styleUrl: './about.css',
})
export class About {
    protected readonly farmSlides = [
        {
            src: './images/about/fpm-vaches-parc-2.jpg',
            alt: 'Vaches Limousines dans les pâturages',
            title: "L'élevage bovin",
            text: "Nous élevons des vaches de race Limousine. Plus de la moitié de l'année, elles profitent des pâturages avec leurs petits. En hiver, elles sont abritées à la ferme et nourries au foin.",
        },
        {
            src: './images/about/fpm-volailles.jpg',
            alt: 'Volailles élevées à la ferme',
            title: 'Nos volailles',
            text: 'Poulets de chair, poules pondeuses, pintades et dindes : nos volailles font également partie de la vie de la ferme.',
        },
        {
            src: './images/about/fpm-champs.jpg',
            alt: 'Champs de céréales de la ferme',
            title: 'Nos cultures céréalières',
            text: "Les cultures représentent une grande partie de notre exploitation. Elles contribuent notamment à l'alimentation de nos animaux.",
        },
        {
            src: './images/about/fpm-legumes.jpg',
            alt: 'Fruits et légumes frais cultivés à la ferme',
            title: 'Nos fruits et légumes',
            text: "Depuis 2020, nous consacrons une partie de nos terres à la production de fruits et légumes, en conversion vers l'agriculture biologique.",
        },
    ];

    protected readonly shopImages = [
        {
            src: './images/about/fpm-magasin.jpg',
            alt: 'Magasin de vente directe de la Ferme du Petit Marais',
        },
        {
            src: './images/about/fpm-magasin-2.jpg',
            alt: 'Étals de produits fermiers dans le magasin',
        },
        { src: './images/about/fpm-magasin-3.jpg', alt: 'Intérieur du magasin de la ferme' },
    ];
}
