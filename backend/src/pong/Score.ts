import { GameScore } from './types';
import { SCORE_TO_WIN } from './constants';

export class Score {
  private score: GameScore;

  constructor() {
    this.score = { player1: 0, player2: 0 };
  }

  public incrementPlayer(): void {
    this.score.player1++;
  }

  public incrementOpponent(): void {
    this.score.player2++;
  }

  public reset(): void {
    this.score = { player1: 0, player2: 0 };
  }

  public getScore(): GameScore {
    return { ...this.score };
  }

  public hasWinner(): boolean {
    return this.score.player1 >= SCORE_TO_WIN || this.score.player2 >= SCORE_TO_WIN;
  }

//   public getWinner(): 'player' | 'computer' | null {
//     if (this.score.player >= SCORE_TO_WIN) return 'player';
//     if (this.score.opponent >= SCORE_TO_WIN) return 'computer';
//     return null;
//   }
  public getWinner(): number | null {
    if (this.score.player1 >= SCORE_TO_WIN) return 1;
    if (this.score.player2 >= SCORE_TO_WIN) return 2;
    return null;
  }
} 