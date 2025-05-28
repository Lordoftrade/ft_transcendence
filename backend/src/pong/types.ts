export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export const GameState = {
  MODE_SELECTION: 'modeSelection',
  START:           'start',
  PLAYING:         'playing',
  PAUSED:          'paused',
  GAME_OVER:       'gameOver',
} as const

// 2) Тип-унития, равная всем значениям этого объекта
export type GameState = typeof GameState[keyof typeof GameState]

// Повторяем для GameMode
export const GameMode = {
  VS_COMPUTER: 'vsComputer',
  VS_PLAYER:   'vsPlayer',
} as const

export type GameMode = typeof GameMode[keyof typeof GameMode]

export interface GameScore {
  player1: number;
  player2: number;
} 