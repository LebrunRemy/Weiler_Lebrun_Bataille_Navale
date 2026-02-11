import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EtatJeuService } from '../../services/etat-jeu/etat-jeu.service';

@Component({
  selector: 'app-ecran-demarrage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecran-demarrage.component.html',
  styleUrls: ['./ecran-demarrage.component.css']
})
export class EcranDemarrageComponent {
  constructor(public state: EtatJeuService) {}

  get player1Name() {
    return this.state.players()[0].name;
  }
  set player1Name(value: string) {
    this.state.setPlayerName(0, value);
  }

  get player2Name() {
    return this.state.players()[1].name;
  }
  set player2Name(value: string) {
    this.state.setPlayerName(1, value);
  }

  get battleTimerSeconds() {
    return this.state.battleTimerSeconds();
  }
  set battleTimerSeconds(value: number) {
    this.state.setBattleTimerSeconds(value);
  }

  get noTimer() {
    return this.state.noTimer();
  }
  set noTimer(value: boolean) {
    this.state.setNoTimer(value);
  }

  get vsAI() {
    return this.state.vsAI();
  }
  set vsAI(value: boolean) {
    this.state.setVsAI(value);
  }

  get modeRapide() {
    return this.state.modeRapide();
  }
  set modeRapide(value: boolean) {
    this.state.setModeRapide(value);
  }

  get difficulteIA() {
    return this.state.difficulteIA();
  }
  set difficulteIA(value: 'facile' | 'moyen' | 'difficile') {
    this.state.setDifficulteIA(value);
  }
}
