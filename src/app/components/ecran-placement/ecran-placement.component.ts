import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatJeuService } from '../../services/etat-jeu/etat-jeu.service';

@Component({
  selector: 'app-ecran-placement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-placement.component.html',
  styleUrls: ['./ecran-placement.component.css']
})
export class EcranPlacementComponent {
  constructor(public state: EtatJeuService) {}
}
