export type Cell = '~' | 'B' | 'X' | 'O';

export interface Ship {
  name: string;
  size: number;
  horizontal: boolean;
  placed: boolean;
  hits: number;
  placedBy?: 'manual' | 'auto';
}

export interface Player {
  name: string;
  ownGrid: Cell[][];
  targetGrid: Cell[][];
  shipGrid: (string | null)[][];
  ships: Ship[];
}

export type ActionType = 'hit' | 'miss' | 'sunk' | 'info';

export interface ActionLog {
  type: ActionType;
  text: string;
}

export interface PlayerStats {
  shots: number;
  hits: number;
  misses: number;
  sunk: number;
}
