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
  ERROR:           'error',

} as const

// 2) Тип-унития, равная всем значениям этого объекта
export type GameState = typeof GameState[keyof typeof GameState]

// Повторяем для GameMode
export const GameMode = {
  VS_COMPUTER: 'vsComputer',
  VS_PLAYER:   'vsPlayer',
  QUICK:       'quick',
} as const

export type GameMode = typeof GameMode[keyof typeof GameMode]

export interface GameScore {
  leftPlayer: number; // left paddle
  rightPlayer: number; // right paddle (may be a player or a computer)
}

export interface GamesStateDto {
	ballPos: Position;
	player1PaddlePos: Position;
	player2PaddlePos: Position;
	score: { player: number; opponent: number;};
	gameState: string;
	isWaitingForBallSpawn: boolean;
	lastScoreTime: number;
	hasWinner: boolean;
	winnerId: number | null;
}