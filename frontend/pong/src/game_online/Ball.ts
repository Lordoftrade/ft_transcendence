import { Position, Velocity } from '../utils/types';
import { BALL_SIZE, COLORS } from '../utils/constants';

export class Ball {
  private position: Position = { x: 400, y: 300 };
  private size: number = BALL_SIZE;
  private isVisible: boolean = true;

  constructor() {}

  public setPosition(x: number, y: number): void {
    this.position = { x, y };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    ctx.fillStyle = COLORS.BALL;
    ctx.beginPath();
    ctx.arc(
      this.position.x,
      this.position.y,
      this.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  public hide(): void {
    this.isVisible = false;
  }

  public show(): void {
    this.isVisible = true;
  }

  public getSize(): number {
    return this.size;
  }
}