import { GameState, GameMode } from '../utils/types';
import { Paddle } from './Paddle';
import { Ball } from './Ball';
import { Score } from './Score';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerPaddle: Paddle;
  private computerPaddle: Paddle;
  private ball: Ball;
  private score: Score;
  private gameState: GameState;
  private gameMode: GameMode | null = null;
  private gameMessage: HTMLElement;
  private animationFrameId: number | null = null;
  private lastComputerMoveTime: number = 0;
  private lastComputerMoveDirection: 'up' | 'down' | null = null;
  private lastComputerMoveDistance: number = 0;
  private lastScoreTime: number = 0;
  private readonly SCORE_DELAY = 1000; // 1 second delay
  private isWaitingForBallSpawn: boolean = false;
  private isGameStartCountdown: boolean = false;
  private lastFrameTime: number = 0;
  private targetPaddlePositions: { player: number; computer: number } | null = null;

  constructor(mode?: GameMode) {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.gameMessage = document.getElementById('gameMessage') as HTMLElement;
    this.lastFrameTime = performance.now();

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Initialize game objects
    this.playerPaddle = new Paddle(50, true);
    this.computerPaddle = new Paddle(this.canvas.width - 60, false);
    this.ball = new Ball();
    this.score = new Score();
    this.gameMode = mode ?? null;
    this.gameState = mode != null
      ? GameState.START
      : GameState.MODE_SELECTION;

    // Set up event listeners
    this.setupEventListeners();
  }

private setupEventListeners(): void {
  document.addEventListener('keydown', (e) => {
    // только когда игра идёт
    if (this.gameState !== GameState.PLAYING) {
      // запуск/пауза/рестарт
      if (e.code === 'Space') {
        if (this.gameState === GameState.START
          || this.gameState === GameState.PAUSED
          || this.gameState === GameState.GAME_OVER) {
          this.startGame();
        } else {
          this.pauseGame();
        }
      }
      if (e.code === 'Escape') {
        this.resetGame();
      }
      return;
    }

    // управление первой ракеткой
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      this.playerPaddle.move('up', this.canvas.height);
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      this.playerPaddle.move('down', this.canvas.height);
    }

    // управление второй (в режиме VS_PLAYER)
    if (this.gameMode === GameMode.VS_PLAYER) {
      if (e.code === 'KeyO') {
        this.computerPaddle.move('up', this.canvas.height);
      } else if (e.code === 'KeyL') {
        this.computerPaddle.move('down', this.canvas.height);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (this.gameState !== GameState.PLAYING) return;

    // остановка первой ракетки
    if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
      this.playerPaddle.stop();
    }
    // остановка второй (только в VS_PLAYER)
    if (this.gameMode === GameMode.VS_PLAYER
      && ['KeyO', 'KeyL'].includes(e.code)) {
      this.computerPaddle.stop();
    }
  });
}

  // private setupEventListeners(): void {
  //   document.addEventListener('keydown', (e) => {
  //     switch (e.key) {
  //       case 'ArrowUp':
  //       case 'w':
  //       case 'W':
  //         if (this.gameState === GameState.PLAYING) {
  //           this.playerPaddle.move('up', this.canvas.height);
  //         }
  //         break;
  //       case 'ArrowDown':
  //       case 's':
  //       case 'S':
  //         if (this.gameState === GameState.PLAYING) {
  //           this.playerPaddle.move('down', this.canvas.height);
  //         }
  //         break;
  //       case 'o':
  //       case 'O':
  //         if (this.gameState === GameState.PLAYING && this.gameMode === GameMode.VS_PLAYER) {
  //           this.computerPaddle.move('up', this.canvas.height);
  //         }
  //         break;
  //       case 'l':
  //       case 'L':
  //         if (this.gameState === GameState.PLAYING && this.gameMode === GameMode.VS_PLAYER) {
  //           this.computerPaddle.move('down', this.canvas.height);
  //         }
  //         break;
  //       case ' ':
  //         if (this.gameState === GameState.START || 
  //             this.gameState === GameState.PAUSED || 
  //             this.gameState === GameState.GAME_OVER) {
  //           this.startGame();
  //         } else if (this.gameState === GameState.PLAYING) {
  //           this.pauseGame();
  //         }
  //         break;
  //       case 'Escape':
  //         this.resetGame();
  //         break;
  //     }
  //   });

  //   document.addEventListener('keyup', (e) => {
  //     if (this.gameState !== GameState.PLAYING) return;

  //     if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
  //         e.key === 'w' || e.key === 'W' || 
  //         e.key === 's' || e.key === 'S') {
  //       this.playerPaddle.stop();
  //     }
      
  //     if (this.gameMode === GameMode.VS_PLAYER && 
  //         (e.key === 'o' || e.key === 'O' || 
  //          e.key === 'l' || e.key === 'L')) {
  //       this.computerPaddle.stop();
  //     }
  //   });
  // }

  public start(): void {
    this.hideMessage(); // Hide the message element since we're drawing on canvas
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    if (this.gameState !== GameState.PLAYING) return;

    this.updatePaddlePositions(deltaTime);
    this.playerPaddle.update(this.canvas.height, deltaTime);
    this.ball.update(this.canvas.width, this.canvas.height, deltaTime);
    
    if (this.gameMode === GameMode.VS_COMPUTER) {
      this.updateComputerPaddle(deltaTime);
    } else {
      this.computerPaddle.update(this.canvas.height, deltaTime);
    }
    
    this.checkCollisions();
    this.checkScoring();
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1A1A1A';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw game objects
    this.playerPaddle.draw(this.ctx);
    this.computerPaddle.draw(this.ctx);
    
    // Only draw ball if not in countdown
    if (!this.isGameStartCountdown && !this.isWaitingForBallSpawn) {
      this.ball.draw(this.ctx);
    }

    // Draw countdown if waiting for ball spawn or game start countdown
    if ((this.isWaitingForBallSpawn || this.isGameStartCountdown) && !this.score.hasWinner()) {
      const currentTime = performance.now();
      const timeElapsed = currentTime - this.lastScoreTime;
      
      this.ctx.font = '120px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Show countdown numbers and GO! with different colors
      if (timeElapsed < 250) {
        this.ctx.fillStyle = '#FF0000'; // Red
        this.ctx.fillText('3', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 500) {
        this.ctx.fillStyle = '#FFA500'; // Orange
        this.ctx.fillText('2', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 750) {
        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.fillText('1', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 1000) {
        this.ctx.fillStyle = '#00FF00'; // Green
        this.ctx.fillText('GO!', this.canvas.width / 2, this.canvas.height / 2);
      } else if (this.isGameStartCountdown) {
        this.isGameStartCountdown = false;
        this.resetBall();
        this.ball.show();
      }
    }

    // Draw all game messages on canvas
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.gameState === GameState.MODE_SELECTION) {
      this.ctx.font = '40px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Choose game mode:', this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.ctx.font = '30px Arial';
      // this.ctx.fillText('Press 1 to play against computer', this.canvas.width / 2, this.canvas.height / 2 + 20);
      // this.ctx.fillText('Press 2 to play with a human player', this.canvas.width / 2, this.canvas.height / 2 + 60);
    } else if (this.gameState === GameState.START) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.PAUSED) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('PAUSED - Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.GAME_OVER) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      const winner = this.score.getWinner();
      let left_winner;
      let right_winner;
      if (this.gameMode === GameMode.VS_PLAYER) {
        left_winner = 'Left player';
        right_winner = 'Right player';
      } else if (this.gameMode === GameMode.VS_COMPUTER) {
        left_winner = 'You';
        right_winner = 'Computer';
      }
      this.ctx.fillText(`${winner === 'player' ? left_winner : right_winner} won! Press SPACE to play again`, 
        this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  private updateComputerPaddle(deltaTime: number): void {
    if (this.targetPaddlePositions) {
      return;
    }

    const ballPos = this.ball.getPosition();
    const paddlePos = this.computerPaddle.getPosition();
    const paddleSize = this.computerPaddle.getSize();
    const paddleCenter = paddlePos.y + paddleSize.height / 2;

    // Целевая позиция — либо за мячом, либо к центру
    let targetY: number;
    if (this.ball.getVelocity().x > 0) {
      // Мяч летит к компьютеру — следуем за ним
      targetY = ballPos.y;
    } else {
      // Мяч летит от компьютера — возвращаемся к центру
      targetY = this.canvas.height / 2;
    }

    // Ограничиваем скорость движения ИИ
    const maxSpeed = 300; // пикселей в секунду, уменьшите для большей плавности
    const distance = targetY - paddleCenter;
    const move = Math.sign(distance) * Math.min(Math.abs(distance), maxSpeed * deltaTime);

    this.computerPaddle.setCenterY(paddleCenter + move, this.canvas.height);

    this.computerPaddle.update(this.canvas.height, deltaTime);
  }

  private checkCollisions(): void {
    const ballPos = this.ball.getPosition();
    const ballSize = this.ball.getSize();
    const ballVel = this.ball.getVelocity();

    // Check paddle collisions
    [this.playerPaddle, this.computerPaddle].forEach(paddle => {
      const paddlePos = paddle.getPosition();
      const paddleSize = paddle.getSize();

      // Check if ball is colliding with paddle
      if (
        ballPos.x + ballSize / 2 >= paddlePos.x &&
        ballPos.x - ballSize / 2 <= paddlePos.x + paddleSize.width &&
        ballPos.y + ballSize / 2 >= paddlePos.y &&
        ballPos.y - ballSize / 2 <= paddlePos.y + paddleSize.height
      ) {
        // Determine which part of the paddle was hit
        const isPlayerPaddle = paddle.isPlayerPaddle();
        const paddleCenterX = isPlayerPaddle ? paddlePos.x + paddleSize.width : paddlePos.x;
        const paddleCenterY = paddlePos.y + paddleSize.height / 2;
        
        // Calculate relative position of ball to paddle center
        const relativeY = (ballPos.y - paddleCenterY) / (paddleSize.height / 2);
        
        // Check if ball hit the side of the paddle
        const hitSide = isPlayerPaddle ? 
          (ballPos.x + ballSize / 2 <= paddlePos.x + paddleSize.width / 4) :
          (ballPos.x - ballSize / 2 >= paddlePos.x + paddleSize.width * 3/4);

        if (hitSide) {
          // Side hit - ball bounces off the side wall
          this.ball.reverseX();
          // Add some vertical velocity based on where it hit the paddle
          this.ball.setVelocityY(relativeY * this.ball.getCurrentSpeed());
        } else {
          // Front hit - normal paddle hit
          this.ball.reverseX();
          // Add some vertical velocity based on where it hit the paddle
          this.ball.setVelocityY(relativeY * this.ball.getCurrentSpeed());
        }
      }
    });
  }

  private checkScoring(): void {
    const ballPos = this.ball.getPosition();
    const ballSize = this.ball.getSize();
    const currentTime = performance.now();

    // Only check for scoring if we're not waiting for ball spawn
    if (!this.isWaitingForBallSpawn) {
      if (ballPos.x - ballSize / 2 <= 0) {
        this.score.incrementComputer();
        this.lastScoreTime = currentTime;
        this.ball.hide();
        this.isWaitingForBallSpawn = true;
        this.startPaddleReset();
      } else if (ballPos.x + ballSize / 2 >= this.canvas.width) {
        this.score.incrementPlayer();
        this.lastScoreTime = currentTime;
        this.ball.hide();
        this.isWaitingForBallSpawn = true;
        this.startPaddleReset();
      }
    }

    // Reset ball after delay
    if (this.isWaitingForBallSpawn && currentTime - this.lastScoreTime >= this.SCORE_DELAY) {
      this.resetBall();
      this.lastScoreTime = 0;
      this.isWaitingForBallSpawn = false;
      this.targetPaddlePositions = null;
    }

    if (this.score.hasWinner()) {
      this.endGame();
    }
  }

  private updatePaddlePositions(deltaTime: number): void {
    if (this.targetPaddlePositions) {
      const currentTime = performance.now();
      const timeElapsed = currentTime - this.lastScoreTime;
      
      // Reset paddles instantly at the midpoint of countdown
      if (timeElapsed >= this.SCORE_DELAY / 2) {
        this.resetPaddles();
        this.targetPaddlePositions = null;
      }
    }
  }

  private startPaddleReset(): void {
    // Just set the flag to trigger reset at midpoint
    this.targetPaddlePositions = { player: 0, computer: 0 };
  }

  private resetPaddles(): void {
    // Reset player paddle to center
    this.playerPaddle.reset(this.canvas.height);
    // Reset computer paddle to center
    this.computerPaddle.reset(this.canvas.height);
  }

  private resetBall(): void {
    this.ball.reset();
    this.ball.show();
  }

  private startGame(): void {
    if (this.gameState === GameState.GAME_OVER) {
        // Store the current game mode before reset
        const currentMode = this.gameMode;
        this.resetGame();
        // Restore the game mode
        this.gameMode = currentMode;
    }
    this.isGameStartCountdown = true;
    this.lastScoreTime = performance.now();
    this.gameState = GameState.PLAYING;
    this.ball.hide(); // Hide ball during countdown
    this.startPaddleReset(); // Start smooth paddle reset
    this.hideMessage();
  }

  private pauseGame(): void {
    this.gameState = GameState.PAUSED;
    this.hideMessage();
  }

  private endGame(): void {
    this.gameState = GameState.GAME_OVER;
    this.hideMessage();
  }

  private resetGame(): void {
    this.score.reset();
    this.resetBall();
    this.targetPaddlePositions = null;
    this.gameState = GameState.MODE_SELECTION;
    this.gameMode = null;
    this.isGameStartCountdown = false;
    // Reset both paddles to ensure their internal state is cleared
    this.playerPaddle.reset(this.canvas.height);
    this.computerPaddle.reset(this.canvas.height);
    this.hideMessage();
  }

  private showMessage(message: string): void {
    // We're not using the message element anymore, all messages are drawn on canvas
    this.hideMessage();
  }

  private hideMessage(): void {
    this.gameMessage.style.display = 'none';
  }
}