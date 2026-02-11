import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatJeuService } from '../../services/etat-jeu/etat-jeu.service';

@Component({
  selector: 'app-ecran-transition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-transition.component.html',
  styleUrls: ['./ecran-transition.component.css']
})
export class EcranTransitionComponent {
  constructor(public state: EtatJeuService) {}
}
