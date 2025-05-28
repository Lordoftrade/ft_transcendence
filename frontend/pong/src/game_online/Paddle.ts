import { Position, Size } from '../utils/types';
import { PADDLE_HEIGHT, PADDLE_WIDTH, COLORS } from '../utils/constants';

export class Paddle {
  private position: Position;
  private size: Size;
  // private currentSpeed: number;
  private isPlayer: boolean;
  private color: string;


  constructor(x: number, isPlayer: boolean, color: string) {
    this.position = { x, y: 250 }; // Start in the middle vertically
    this.size = { width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    // this.currentSpeed = 0;
    this.isPlayer = isPlayer;
    this.color = color;
  }
  // add purple color code to this comment: #800080
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color// '#00FF00' : '#F08080'; // Green for player, Red for opponent
    ctx.fillRect(
      this.position.x,
      Math.round(this.position.y),
      this.size.width,
      this.size.height
    );
  }

  public move(direction: 'up' | 'down', canvasHeight: number): void {
  }

  public stop(): void {
  }


  public getPosition(): Position {
    return { ...this.position };
  }

  public getSize(): Size {
    return { ...this.size };
  }

  public isPlayerPaddle(): boolean {
    return this.isPlayer;
  }

  public reset(canvasHeight: number): void {
    this.position.y = (canvasHeight - this.size.height) / 2;
    // this.currentSpeed = 0;
  }

  public setPosition(y: number): void {
    this.position.y = y;
  }

  public setCenterY(y: number, canvasHeight: number): void {
    const size = this.getSize();
    this.position.y = Math.max(0, Math.min(canvasHeight - size.height, y - size.height / 2));
  }
}