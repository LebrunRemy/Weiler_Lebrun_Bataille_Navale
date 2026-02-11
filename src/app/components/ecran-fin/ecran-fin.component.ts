import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatJeuService } from '../../services/etat-jeu/etat-jeu.service';

@Component({
  selector: 'app-ecran-fin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-fin.component.html',
  styleUrls: ['./ecran-fin.component.css']
})
export class EcranFinComponent {
  constructor(public state: EtatJeuService) {}
}
