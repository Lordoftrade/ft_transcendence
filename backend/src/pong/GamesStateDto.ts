import { GameScore, Position } from "./types";

export interface GamesStateDto {
	type: string;
	ballPos: Position;
	player1PaddlePos: Position;
	player2PaddlePos: Position;
	score: GameScore;
	gameState: string;
	isWaitingForBallSpawn: number;
	lastScoreTime: number;
	hasWinner: boolean;
	winnerId: number | null;
}