import { Position, Size } from '../utils/types';
import { PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_SPEED, PADDLE_ACCELERATION, COLORS } from '../utils/constants';

export class Paddle {
  private position: Position;
  private size: Size;
  private speed: number;
  private currentSpeed: number;
  private isPlayer: boolean;
  private isMoving: boolean;
  private moveDirection: 'up' | 'down' | null;

  constructor(x: number, isPlayer: boolean) {
    this.position = { x, y: 250 }; // Start in the middle vertically
    this.size = { width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    this.speed = PADDLE_SPEED;
    this.currentSpeed = 0;
    this.isPlayer = isPlayer;
    this.isMoving = false;
    this.moveDirection = null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLORS.PADDLE;
    ctx.fillRect(
      this.position.x,
      Math.round(this.position.y),
      this.size.width,
      this.size.height
    );
  }

  public move(direction: 'up' | 'down', canvasHeight: number): void {
    this.isMoving = true;
    this.moveDirection = direction;
  }

  public stop(): void {
    this.isMoving = false;
    this.moveDirection = null;
  }

  public update(canvasHeight: number, deltaTime: number): void {
    if (this.isMoving && this.moveDirection) {
      // Accelerate
      this.currentSpeed = Math.min(this.speed, this.currentSpeed + PADDLE_ACCELERATION * deltaTime);
    } else {
      // Decelerate
      this.currentSpeed = Math.max(0, this.currentSpeed - PADDLE_ACCELERATION * deltaTime);
    }

    if (this.currentSpeed > 0 && this.moveDirection) {
      if (this.moveDirection === 'up') {
        this.position.y = Math.max(0, this.position.y - this.currentSpeed * deltaTime);
      } else {
        this.position.y = Math.min(
          canvasHeight - this.size.height,
          this.position.y + this.currentSpeed * deltaTime
        );
      }
    }
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
    this.currentSpeed = 0;
    this.isMoving = false;
    this.moveDirection = null;
  }

  public setPosition(y: number): void {
    this.position.y = y;
  }

  public setCenterY(y: number, canvasHeight: number): void {
    const size = this.getSize();
    this.position.y = Math.max(0, Math.min(canvasHeight - size.height, y - size.height / 2));
  }
}