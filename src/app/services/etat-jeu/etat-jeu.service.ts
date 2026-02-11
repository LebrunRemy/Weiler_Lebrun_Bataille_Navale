import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { ActionLog, ActionType, Cell, Player, PlayerStats, Ship } from '../../models/modele-jeu/modele-jeu';
import { IaService } from '../ia/ia.service';
import { ServiceAudio } from '../audio/audio.service';
import { ServiceStockage } from '../stockage/stockage.service';

type Phase = 'start' | 'placement1' | 'placement2' | 'transition' | 'battle' | 'end';

@Injectable({ providedIn: 'root' })
export class EtatJeuService implements OnDestroy {
  phase = signal<Phase>('start');
  currentPlayer = signal(0);
  nextPlayer = signal(0);
  timer = signal(0);
  message = signal('');
  winner = signal('');
  canShoot = signal(true);

  players = signal<Player[]>([
    {
      name: '',
      ownGrid: [],
      targetGrid: [],
      shipGrid: [],
      ships: []
    },
    {
      name: '',
      ownGrid: [],
      targetGrid: [],
      shipGrid: [],
      ships: []
    }
  ]);
  actionHistory = signal<ActionLog[]>([]);
  stats = signal<PlayerStats[]>([this.createStats(), this.createStats()]);

  battleTimerSeconds = signal(20);
  noTimer = signal(false);
  theme = signal<'dark' | 'light'>('dark');
  vsAI = signal(false);
  difficulteIA = signal<'facile' | 'moyen' | 'difficile'>('moyen');
  modeRapide = signal(false);
  gridSize = signal(10);

  availableShips = computed(() =>
    this.players()[this.currentPlayer()].ships.filter((s: Ship) => !s.placed)
  );

  private draggedShip: Ship | null = null;
  private interval: any = null;
  private transitionTimeout: any = null;
  private aiTimeout: any = null;
  private aiTargets: { x: number; y: number }[] = [];
  private gameStartTime: number | null = null;
  gameDurationSec = signal(0);

  constructor(
    private ai: IaService,
    private audio: ServiceAudio,
    private storage: ServiceStockage
  ) {
    const savedP1 = this.storage.getString('bn_player_1');
    const savedP2 = this.storage.getString('bn_player_2');
    const savedTheme = this.storage.getString('bn_theme') as 'dark' | 'light';
    const savedTimer = this.storage.getNumber('bn_timer', 20);
    const savedNoTimer = this.storage.getBoolean('bn_no_timer', false);
    const savedVsAI = this.storage.getBoolean('bn_vs_ai', false);
    const savedDifficulte = this.storage.getString('bn_difficulte_ia');
    const savedModeRapide = this.storage.getBoolean('bn_mode_rapide', false);

    if (savedP1) this.players()[0].name = savedP1;
    if (savedP2) this.players()[1].name = savedP2;
    if (savedTheme) this.theme.set(savedTheme);
    this.battleTimerSeconds.set(savedTimer || 20);
    this.noTimer.set(savedNoTimer);
    this.vsAI.set(savedVsAI);
    this.modeRapide.set(savedModeRapide);
    this.gridSize.set(this.modeRapide() ? 6 : 10);
    if (savedDifficulte === 'facile' || savedDifficulte === 'moyen' || savedDifficulte === 'difficile') {
      this.difficulteIA.set(savedDifficulte);
    }

    if (this.vsAI() && !this.players()[1].name) {
      this.players()[1].name = 'IA';
    }

    this.initializePlayers();
    this.applyTheme();
  }

  ngOnDestroy() {
    this.clearTimer();
    this.clearTransitionTimeout();
    this.clearAiTimeout();
  }

  /* ---------- FACTORY ---------- */
  createPlayer(): Player {
    return {
      name: '',
      ownGrid: this.createGrid(),
      targetGrid: this.createGrid(),
      shipGrid: this.createShipGrid(),
      ships: this.createShips()
    };
  }

  private initializePlayers() {
    this.players.set([this.createPlayer(), this.createPlayer()]);
  }

  createGrid(): Cell[][] {
    const size = this.gridSize();
    return Array.from({ length: size }, () => Array.from({ length: size }, () => '~'));
  }

  createShipGrid(): (string | null)[][] {
    const size = this.gridSize();
    return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  }

  createShips(): Ship[] {
    if (this.gridSize() === 6) {
      return [
        { name: 'Corvette', size: 3, horizontal: true, placed: false, hits: 0, placedBy: undefined },
        { name: 'Frégate', size: 3, horizontal: true, placed: false, hits: 0, placedBy: undefined },
        { name: 'Patrouilleur', size: 2, horizontal: true, placed: false, hits: 0, placedBy: undefined },
        { name: 'Vedette', size: 2, horizontal: true, placed: false, hits: 0, placedBy: undefined }
      ];
    }
    return [
      { name: 'Porte-avions', size: 5, horizontal: true, placed: false, hits: 0, placedBy: undefined },
      { name: 'Cuirassé', size: 4, horizontal: true, placed: false, hits: 0, placedBy: undefined },
      { name: 'Croiseur', size: 3, horizontal: true, placed: false, hits: 0, placedBy: undefined },
      { name: 'Sous-marin', size: 3, horizontal: true, placed: false, hits: 0, placedBy: undefined },
      { name: 'Destroyer', size: 2, horizontal: true, placed: false, hits: 0, placedBy: undefined }
    ];
  }

  createStats(): PlayerStats {
    return { shots: 0, hits: 0, misses: 0, sunk: 0 };
  }

  /* ---------- DERIVED ---------- */
  getPlacedShipsCount(): number {
    return this.players()[this.currentPlayer()].ships.filter((s: Ship) => s.placed).length;
  }

  allShipsPlaced(): boolean {
    return this.players()[this.currentPlayer()].ships.every((s: Ship) => s.placed);
  }

  getSunkShips(playerIndex: number): Ship[] {
    return this.players()[playerIndex].ships.filter((s: Ship) => s.placed && s.hits === s.size);
  }

  getActiveShips(playerIndex: number): Ship[] {
    return this.players()[playerIndex].ships.filter((s: Ship) => s.placed && s.hits < s.size);
  }

  /* ---------- TIMER ---------- */
  clearTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  clearTransitionTimeout() {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }

  clearAiTimeout() {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
  }

  startTimer(seconds: number) {
    if (this.noTimer()) return;
    this.clearTimer();
    this.timer.set(seconds);

    this.interval = setInterval(() => {
      this.timer.update(t => t - 1);
      if (this.timer() <= 0) {
        this.clearTimer();
        this.handleTimerEnd();
      }
    }, 1000);
  }

  handleTimerEnd() {
    if (this.phase() === 'placement1' || this.phase() === 'placement2') {
      if (!this.allShipsPlaced()) {
        this.randomPlacement();
      }
      this.validatePlacement();
    } else if (this.phase() === 'battle') {
      this.message.set('Temps écoulé !');
      this.addHistory('info', `${this.players()[this.currentPlayer()].name} a laissé le temps s'écouler.`);
      this.canShoot.set(false);

      this.transitionTimeout = setTimeout(() => {
        this.forceEndTurn();
        this.canShoot.set(true);
      }, 2000);
    }
  }

  forceEndTurn() {
    if (this.vsAI()) {
      this.currentPlayer.set(1 - this.currentPlayer());
      this.message.set('');
      this.canShoot.set(true);
      this.clearTimer();
      this.clearTransitionTimeout();
      this.startTimer(this.battleTimerSeconds());
      this.scheduleAiTurnIfNeeded();
      return;
    }

    this.nextPlayer.set(1 - this.currentPlayer());
    this.phase.set('transition');
    this.clearTimer();
    this.clearTransitionTimeout();
  }

  /* ---------- START ---------- */
  startGame() {
    if (!this.players()[0].name) return;
    if (this.vsAI() && !this.players()[1].name) {
      this.players()[1].name = 'IA';
    }
    if (!this.vsAI() && !this.players()[1].name) return;

    this.storage.setString('bn_player_1', this.players()[0].name);
    this.storage.setString('bn_player_2', this.players()[1].name);
    this.storage.setNumber('bn_timer', this.battleTimerSeconds());
    this.storage.setBoolean('bn_no_timer', this.noTimer());
    this.storage.setBoolean('bn_vs_ai', this.vsAI());
    this.storage.setString('bn_difficulte_ia', this.difficulteIA());
    this.storage.setBoolean('bn_mode_rapide', this.modeRapide());

    this.currentPlayer.set(0);
    this.phase.set('placement1');
    this.message.set('');
    this.gameStartTime = Date.now();
    this.gameDurationSec.set(0);
    this.startTimer(60);
  }

  /* ---------- PLACEMENT ---------- */
  startDrag(ship: Ship) {
    if (ship.placed) {
      alert("Plac\u00e9, c'est plac\u00e9. Reprendre, c'est tricher.");
      return;
    }
    this.draggedShip = ship;
  }

  rotateShip(ship: Ship) {
    ship.horizontal = !ship.horizontal;
    this.touchPlayers();
  }

  dropShip(x: number, y: number) {
    if (!this.draggedShip) return;

    const ship = this.draggedShip;
    const player = this.players()[this.currentPlayer()];
    const size = this.gridSize();

    const length = Math.max(1, Number(ship.size) || 1);
    for (let i = 0; i < length; i++) {
      const nx = ship.horizontal ? x : x + i;
      const ny = ship.horizontal ? y + i : y;
      if (nx >= size || ny >= size) return;
      if (player.shipGrid[nx][ny] && player.shipGrid[nx][ny] !== ship.name) {
        return;
      }
    }

    if (ship.placed) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (player.shipGrid[i][j] === ship.name) {
            player.shipGrid[i][j] = null;
          }
        }
      }
    }

    for (let i = 0; i < length; i++) {
      const nx = ship.horizontal ? x : x + i;
      const ny = ship.horizontal ? y + i : y;
      player.shipGrid[nx][ny] = ship.name;
    }
    this.syncOwnGridFromShipGrid(player);

    ship.placed = true;
    ship.placedBy = 'manual';
    this.draggedShip = null;
    this.touchPlayers();
  }

  warnPlacedShip(x: number, y: number) {
    if (this.phase() !== 'placement1' && this.phase() !== 'placement2') return;
    const player = this.players()[this.currentPlayer()];
    if (player.shipGrid[x][y]) {
      alert("Plac\u00e9, c'est plac\u00e9. Reprendre, c'est tricher.");
    }
  }

  private syncOwnGridFromShipGrid(player: Player) {
    player.ownGrid = this.createGrid();
    const size = this.gridSize();
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (player.shipGrid[x][y]) {
          player.ownGrid[x][y] = 'B';
        }
      }
    }
  }

  randomPlacement() {
    const player = this.players()[this.currentPlayer()];
    const size = this.gridSize();
    const aReplacer = new Set(
      player.ships.filter(s => s.placedBy !== 'manual').map(s => s.name)
    );

    if (aReplacer.size > 0) {
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const name = player.shipGrid[x][y];
          if (name && aReplacer.has(name)) {
            player.shipGrid[x][y] = null;
          }
        }
      }
    }

    for (const ship of player.ships) {
      if (ship.placedBy === 'manual') continue;
      ship.placed = false;
      let placed = false;
      let attempts = 0;
      const maxAttempts = 300;
      const length = Math.max(1, Number(ship.size) || 1);

      while (!placed && attempts < maxAttempts) {
        attempts++;
        ship.horizontal = Math.random() < 0.5;
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        let valid = true;
        for (let i = 0; i < length; i++) {
          const nx = ship.horizontal ? x : x + i;
          const ny = ship.horizontal ? y + i : y;
          if (nx >= size || ny >= size || player.shipGrid[nx][ny]) {
            valid = false;
            break;
          }
        }
        if (!valid) continue;

        for (let i = 0; i < length; i++) {
          const nx = ship.horizontal ? x : x + i;
          const ny = ship.horizontal ? y + i : y;
          player.shipGrid[nx][ny] = ship.name;
        }
        ship.placed = true;
        ship.placedBy = 'auto';
        placed = true;
      }
    }
    this.syncOwnGridFromShipGrid(player);
    this.touchPlayers();
  }

  validatePlacement() {
    if (!this.allShipsPlaced()) return;

    if (this.vsAI() && this.currentPlayer() === 0) {
      this.currentPlayer.set(1);
      this.randomPlacement();
      this.currentPlayer.set(0);
      this.phase.set('battle');
      this.clearTimer();
      this.startTimer(this.battleTimerSeconds());
      this.scheduleAiTurnIfNeeded();
      return;
    }

    this.nextPlayer.set(this.currentPlayer() === 0 ? 1 : 0);
    this.phase.set('transition');
    this.clearTimer();
  }

  continueAfterTransition() {
    this.currentPlayer.set(this.nextPlayer());
    this.message.set('');
    this.canShoot.set(true);

    if (this.players()[0].ships.every((s: Ship) => s.placed) &&
        this.players()[1].ships.every((s: Ship) => s.placed)) {
      this.phase.set('battle');
      this.startTimer(this.battleTimerSeconds());
      this.scheduleAiTurnIfNeeded();
    } else {
      this.phase.set(this.currentPlayer() === 0 ? 'placement1' : 'placement2');
      this.startTimer(60);
    }
  }

  /* ---------- BATTLE ---------- */
  shoot(x: number, y: number) {
    if (this.phase() !== 'battle' || !this.canShoot()) return;
    if (this.isAIPlayer(this.currentPlayer())) return;

    const me = this.players()[this.currentPlayer()];
    const enemy = this.players()[1 - this.currentPlayer()];
    const stats = this.stats()[this.currentPlayer()];

    if (me.targetGrid[x][y] !== '~') return;
    stats.shots++;

    if (enemy.ownGrid[x][y] === 'B') {
      enemy.ownGrid[x][y] = 'X';
      me.targetGrid[x][y] = 'X';

      const shipName = enemy.shipGrid[x][y];
      const ship = enemy.ships.find((s: Ship) => s.name === shipName);
      const coord = this.formatShotCoord(x, y);

      if (ship) {
        ship.hits++;
        stats.hits++;

        if (ship.hits === ship.size) {
          this.message.set(`${ship.name} coulé !`);
          this.addHistory('sunk', `${me.name} a coulé ${ship.name} en ${coord}.`);
          stats.sunk++;
          this.audio.playTone(260, 0.12);
          this.audio.playTone(180, 0.12, 0.14);
        } else {
          this.message.set('Touché !');
          this.addHistory('hit', `${me.name} a touché en ${coord}.`);
          this.audio.playTone(420, 0.08);
        }
      }

      if (this.allShipsSunk(enemy)) {
        this.winner.set(me.name);
        this.phase.set('end');
        this.clearTimer();
        if (this.gameStartTime) {
          this.gameDurationSec.set(Math.max(1, Math.floor((Date.now() - this.gameStartTime) / 1000)));
        }
      } else {
        this.startTimer(this.battleTimerSeconds());
      }
    } else {
      me.targetGrid[x][y] = 'O';
      this.message.set('Manqué !');
      this.addHistory('miss', `${me.name} a manqué en ${this.formatShotCoord(x, y)}.`);
      stats.misses++;
      this.audio.playTone(220, 0.08);

      this.clearTimer();
      this.canShoot.set(false);
      this.transitionTimeout = setTimeout(() => {
        this.forceEndTurn();
        this.canShoot.set(true);
      }, 2000);
    }

    this.touchPlayers();
    this.touchStats();
  }

  aiShoot() {
    if (this.phase() !== 'battle' || !this.canShoot() || !this.isAIPlayer(this.currentPlayer())) return;
    const ai = this.players()[this.currentPlayer()];
    const enemy = this.players()[1 - this.currentPlayer()];
    const stats = this.stats()[this.currentPlayer()];

    const target = this.ai.pickTarget(ai.targetGrid, this.aiTargets, this.difficulteIA());
    if (!target) return;
    const { x, y } = target;

    stats.shots++;

    if (enemy.ownGrid[x][y] === 'B') {
      enemy.ownGrid[x][y] = 'X';
      ai.targetGrid[x][y] = 'X';
      const shipName = enemy.shipGrid[x][y];
      const ship = enemy.ships.find((s: Ship) => s.name === shipName);
      const coord = this.formatShotCoord(x, y);
      if (ship) {
        ship.hits++;
        stats.hits++;
        if (ship.hits === ship.size) {
          this.message.set(`${ship.name} coulé !`);
          this.addHistory('sunk', `IA a coulé ${ship.name} en ${coord}.`);
          stats.sunk++;
          this.aiTargets = [];
          this.audio.playTone(260, 0.12);
          this.audio.playTone(180, 0.12, 0.14);
        } else {
          this.message.set('Touché !');
          this.addHistory('hit', `IA a touché en ${coord}.`);
          if (this.difficulteIA() !== 'facile') {
            this.ai.addAdjacentTargets(ai.targetGrid, this.aiTargets, x, y);
          }
          this.audio.playTone(420, 0.08);
        }
      }

      if (this.allShipsSunk(enemy)) {
        this.winner.set(ai.name);
        this.phase.set('end');
        this.clearTimer();
        if (this.gameStartTime) {
          this.gameDurationSec.set(Math.max(1, Math.floor((Date.now() - this.gameStartTime) / 1000)));
        }
      } else {
        this.startTimer(this.battleTimerSeconds());
        this.scheduleAiTurnIfNeeded();
      }
    } else {
      ai.targetGrid[x][y] = 'O';
      this.message.set('Manqué !');
      this.addHistory('miss', `IA a manqué en ${this.formatShotCoord(x, y)}.`);
      stats.misses++;
      this.audio.playTone(220, 0.08);

      this.clearTimer();
      this.canShoot.set(false);

      this.transitionTimeout = setTimeout(() => {
        this.forceEndTurn();
        this.canShoot.set(true);
      }, 800);
    }

    this.touchPlayers();
    this.touchStats();
  }

  allShipsSunk(player: Player): boolean {
    return !player.ownGrid.some((row: Cell[]) => row.includes('B'));
  }

  getShipNameAt(grid: (string | null)[][], x: number, y: number): string {
    return grid[x][y] || '';
  }

  getGridCoordinates(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatShotCoord(x: number, y: number): string {
    return `${this.getGridCoordinates(x)}${y + 1}`;
  }

  addHistory(type: ActionType, text: string) {
    this.actionHistory.set([{ type, text }, ...this.actionHistory()].slice(0, 50));
  }

  getAccuracy(playerIndex: number): number {
    const s = this.stats()[playerIndex];
    if (s.shots === 0) return 0;
    return Math.round((s.hits / s.shots) * 100);
  }

  canPassTurn(): boolean {
    return this.phase() === 'battle' && !this.canShoot();
  }

  passTurnNow() {
    if (!this.canPassTurn()) return;
    this.forceEndTurn();
  }

  toggleTheme() {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
    this.storage.setString('bn_theme', this.theme());
    this.applyTheme();
  }

  applyTheme() {
    document.body.classList.toggle('theme-light', this.theme() === 'light');
  }

  isAIPlayer(index: number): boolean {
    return this.vsAI() && index === 1;
  }

  scheduleAiTurnIfNeeded() {
    this.clearAiTimeout();
    if (!this.isAIPlayer(this.currentPlayer())) return;
    this.aiTimeout = setTimeout(() => this.aiShoot(), 700);
  }

  onVsAiToggle() {
    if (this.vsAI() && !this.players()[1].name) {
      this.players()[1].name = 'IA';
    }
    this.storage.setBoolean('bn_vs_ai', this.vsAI());
    if (this.players()[1].name) {
      this.storage.setString('bn_player_2', this.players()[1].name);
    }
    this.touchPlayers();
  }

  setPlayerName(index: number, name: string) {
    this.players()[index].name = name;
    this.storage.setString(index === 0 ? 'bn_player_1' : 'bn_player_2', name);
    this.touchPlayers();
  }

  setBattleTimerSeconds(value: number) {
    this.battleTimerSeconds.set(value);
    this.storage.setNumber('bn_timer', value);
  }

  setNoTimer(value: boolean) {
    this.noTimer.set(value);
    this.storage.setBoolean('bn_no_timer', value);
  }

  setVsAI(value: boolean) {
    this.vsAI.set(value);
    this.onVsAiToggle();
  }

  setModeRapide(value: boolean) {
    this.modeRapide.set(value);
    this.gridSize.set(value ? 6 : 10);
    this.storage.setBoolean('bn_mode_rapide', value);
    this.initializePlayers();
    this.phase.set('start');
  }

  getIndices(): number[] {
    return Array.from({ length: this.gridSize() }, (_, i) => i);
  }

  setDifficulteIA(value: 'facile' | 'moyen' | 'difficile') {
    this.difficulteIA.set(value);
    this.storage.setString('bn_difficulte_ia', value);
  }

  generateRandomName(): string {
    const adjectives = [
      'Brave', 'Rapide', 'Calme', 'Fier', 'Malin',
      'Sombre', 'Agile', 'Vaillant', 'Ruse', 'Fort'
    ];
    const nouns = [
      'Corsaire', 'Capitaine', 'Marin', 'Nautile', 'Vigie',
      'Flibustier', 'Cartographe', 'Pilote', 'Timonier', 'Explorateur'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(10 + Math.random() * 90);
    return `${adj} ${noun} ${num}`;
  }

  randomizePlayerName(index: number) {
    const name = this.generateRandomName();
    this.players()[index].name = name;
    this.storage.setString(index === 0 ? 'bn_player_1' : 'bn_player_2', name);
    this.touchPlayers();
  }

  /* ---------- RESET ---------- */
  resetGame() {
    this.clearTimer();
    this.clearTransitionTimeout();
    this.clearAiTimeout();
    this.phase.set('start');
    this.currentPlayer.set(0);
    this.nextPlayer.set(0);
    this.timer.set(0);
    this.message.set('');
    this.winner.set('');
    this.draggedShip = null;
    this.canShoot.set(true);
    this.actionHistory.set([]);
    this.stats.set([this.createStats(), this.createStats()]);
    this.gameStartTime = null;
    this.gameDurationSec.set(0);
    this.aiTargets = [];
    this.players.set([this.createPlayer(), this.createPlayer()]);
  }

  resetGameKeepNames() {
    const p1 = this.players()[0].name;
    const p2 = this.players()[1].name;
    this.resetGame();
    this.players()[0].name = p1;
    this.players()[1].name = p2;
    this.storage.setString('bn_player_1', p1);
    this.storage.setString('bn_player_2', p2);
    this.touchPlayers();
  }

  /* ---------- HELPERS ---------- */
  private touchPlayers() {
    this.players.set([...this.players()]);
  }

  private touchStats() {
    this.stats.set([...this.stats()]);
  }
}
