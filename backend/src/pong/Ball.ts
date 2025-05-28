import { Position, Velocity } from './types';
import { BALL_SIZE, INITIAL_BALL_SPEED, BALL_SPEED_INCREMENT, MAX_BALL_SPEED, COLORS } 
from './constants';

export class Ball {
  private position: Position = { x: 400, y: 300 };
  private velocity: Velocity = { x: 0, y: 0 };
  private size: number = BALL_SIZE;
  private isVisible: boolean = true;
  private currentSpeed: number = INITIAL_BALL_SPEED;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.position = { x: 400, y: 300 }; // Center of the screen
    this.currentSpeed = INITIAL_BALL_SPEED;
    const direction = Math.random() > 0.5 ? 1 : -1;
    // Calculate random angle between -45 and 45 degrees
    const angle = (Math.random() - 0.5) * Math.PI / 2;
    this.velocity = {
      x: direction * this.currentSpeed * Math.cos(angle),
      y: this.currentSpeed * Math.sin(angle)
    };
    this.size = BALL_SIZE;
    this.isVisible = true;
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

  public update(canvasWidth: number, canvasHeight: number, deltaTime: number): void {
    // Apply velocity scaled by delta time
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Bounce off top and bottom walls
    if (this.position.y <= this.size / 2 || this.position.y >= canvasHeight - this.size / 2) {
      this.velocity.y = -this.velocity.y;
      // Ensure the ball doesn't get stuck in the wall
      if (this.position.y <= this.size / 2) {
        this.position.y = this.size / 2;
      } else {
        this.position.y = canvasHeight - this.size / 2;
      }
    }
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  public getVelocity(): Velocity {
    return { ...this.velocity };
  }

  public getCurrentSpeed(): number {
    return this.currentSpeed;
  }

  public setVelocityY(y: number): void {
    this.velocity.y = y;
    // Normalize velocity to maintain current speed
    const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (magnitude > 0) {
      this.velocity.x = (this.velocity.x / magnitude) * this.currentSpeed;
      this.velocity.y = (this.velocity.y / magnitude) * this.currentSpeed;
    }
  }

  public reverseX(): void {
    this.velocity.x = -this.velocity.x;
    // Increase speed after paddle hit
    this.currentSpeed = Math.min(MAX_BALL_SPEED, this.currentSpeed + BALL_SPEED_INCREMENT);
    // Normalize velocity to maintain direction but with new speed
    const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (magnitude > 0) {
      this.velocity.x = (this.velocity.x / magnitude) * this.currentSpeed;
      this.velocity.y = (this.velocity.y / magnitude) * this.currentSpeed;
    }
  }

  public reverseY(): void {
    this.velocity.y = -this.velocity.y;
  }

  public getSize(): number {
    return this.size;
  }
} 