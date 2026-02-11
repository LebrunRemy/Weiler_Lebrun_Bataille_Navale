import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatJeuService } from '../../services/etat-jeu/etat-jeu.service';

@Component({
  selector: 'app-ecran-bataille',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-bataille.component.html',
  styleUrls: ['./ecran-bataille.component.css']
})
export class EcranBatailleComponent {
  constructor(public state: EtatJeuService) {}
}
