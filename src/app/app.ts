import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatJeuService } from './services/etat-jeu/etat-jeu.service';
import { EcranDemarrageComponent } from './components/ecran-demarrage/ecran-demarrage.component';
import { EcranPlacementComponent } from './components/ecran-placement/ecran-placement.component';
import { EcranBatailleComponent } from './components/ecran-bataille/ecran-bataille.component';
import { EcranFinComponent } from './components/ecran-fin/ecran-fin.component';
import { EcranTransitionComponent } from './components/ecran-transition/ecran-transition.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    EcranDemarrageComponent,
    EcranPlacementComponent,
    EcranBatailleComponent,
    EcranFinComponent,
    EcranTransitionComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  constructor(public state: EtatJeuService) {}
}
