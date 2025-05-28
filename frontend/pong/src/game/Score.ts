import { GameScore } from '../utils/types';
import { SCORE_TO_WIN } from '../utils/constants';

export class Score {
  private score: GameScore;
  private scoreDisplay: HTMLElement;

  constructor() {
    this.score = { leftPlayer: 0, rightPlayer: 0 };
    this.scoreDisplay = document.getElementById('scoreDisplay') as HTMLElement;
    this.updateDisplay();
  }

  public incrementPlayer(): void {
    this.score.leftPlayer++;
    this.updateDisplay();
  }

  public incrementComputer(): void {
    this.score.rightPlayer++;
    this.updateDisplay();
  }

  public reset(): void {
    this.score = { leftPlayer: 0, rightPlayer: 0 };
    this.updateDisplay();
  }

  public getScore(): GameScore {
    return { ...this.score };
  }

  public hasWinner(): boolean {
    return this.score.leftPlayer >= SCORE_TO_WIN || this.score.rightPlayer >= SCORE_TO_WIN;
  }

  public getWinner(): 'player' | 'computer' | null {
    if (this.score.leftPlayer >= SCORE_TO_WIN) return 'player';
    if (this.score.rightPlayer >= SCORE_TO_WIN) return 'computer';
    return null;
  }

  private updateDisplay(): void {
    this.scoreDisplay.textContent = `${this.score.leftPlayer} - ${this.score.rightPlayer}`;
  }
} 