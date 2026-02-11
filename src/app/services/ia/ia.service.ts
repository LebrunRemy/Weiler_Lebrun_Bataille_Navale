import { Injectable } from '@angular/core';
import { Cell } from '../../models/modele-jeu/modele-jeu';

@Injectable({ providedIn: 'root' })
export class IaService {
  pickTarget(
    targetGrid: Cell[][],
    queue: { x: number; y: number }[],
    difficulte: 'facile' | 'moyen' | 'difficile'
  ): { x: number; y: number } | null {
    if (difficulte !== 'facile') {
      while (queue.length > 0) {
        const next = queue.shift()!;
        if (targetGrid[next.x][next.y] === '~') return next;
      }
    }

    const size = targetGrid.length;
    const candidates: { x: number; y: number }[] = [];
    const parity: { x: number; y: number }[] = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (targetGrid[x][y] === '~') {
          candidates.push({ x, y });
          if ((x + y) % 2 === 0) {
            parity.push({ x, y });
          }
        }
      }
    }
    if (candidates.length === 0) return null;

    if (difficulte === 'difficile' && parity.length > 0) {
      return parity[Math.floor(Math.random() * parity.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  addAdjacentTargets(
    targetGrid: Cell[][],
    queue: { x: number; y: number }[],
    x: number,
    y: number
  ) {
    const deltas = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];
    for (const d of deltas) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      const size = targetGrid.length;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      if (targetGrid[nx][ny] === '~') {
        queue.push({ x: nx, y: ny });
      }
    }
  }
}
