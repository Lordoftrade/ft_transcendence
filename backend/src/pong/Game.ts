import { Ball } from './Ball';
import { Paddle } from './Paddle';
import { Score } from './Score';
import { GamesStateDto } from './GamesStateDto';

export class Game {
	private ball: Ball;
	private player1Paddle: Paddle;
	private player2Paddle: Paddle;
	private score: Score;
	private targetPaddlePositions: { player: number; computer: number } | null = null;
	private gameState: string = 'READY'; // Возможные значения: 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER'
  	private isWaitingForBallSpawn: number = 3;
  	private lastScoreTime: number = 0;
	private readonly SCORE_DELAY = 1000; // 1 second delay

	constructor() {
		this.ball = new Ball();
		this.player1Paddle = new Paddle(50, true);
		this.player2Paddle = new Paddle(750, false);
		this.score = new Score();
	}

	public start(){
	//	this.isGameStartCountdown = true;
		this.gameState = 'PLAYING';
		this.lastScoreTime = performance.now();
		this.ball.hide(); // Hide ball during countdown
		this.startPaddleReset(); // Start smooth paddle reset
	}

	public pause(): void {
		if (this.gameState === 'PLAYING') {
			this.gameState = 'PAUSED';
		}
	}

	public updateState(deltaTime: number): void {
		if (this.gameState !== 'PLAYING') return;

		this.ball.update(800, 600, deltaTime);
		this.player1Paddle.update(600, deltaTime);
		this.player2Paddle.update(600, deltaTime);
		
		this.updatePaddlePositions(deltaTime);
		this.checkCollisions();
		this.checkScore();
	}

	public getState(): GamesStateDto {
		const state = 
		{
			type: "gameState",
			ballPos: this.isWaitingForBallSpawn ? null : this.ball.getPosition(),
			player1PaddlePos: this.player1Paddle.getPosition(),
			player2PaddlePos: this.player2Paddle.getPosition(),
			score: this.score.getScore(),
			gameState: this.gameState,
			isWaitingForBallSpawn: this.isWaitingForBallSpawn,
			lastScoreTime: this.lastScoreTime,
			hasWinner: this.score.hasWinner(),
			winnerId: this.score.getWinner()
		} as GamesStateDto;

		return state;
	}

		
	public reset(){
		this.score.reset();
		this.resetBall();
		this.targetPaddlePositions = null;
		this.gameState = 'READY';
		this.isWaitingForBallSpawn = 3;
	}		

	public handlePlayerInput(direction: string, playerNumber: number): void {
		if (this.gameState !== 'PLAYING') return;

		// const direction = data.direction;
		const paddle = playerNumber === 1 ? this.player1Paddle : this.player2Paddle;

		if (direction === 'up') {
			paddle.move('up', 600);
		} else if (direction === 'down') {
			paddle.move('down', 600);
		} else if (direction === 'stop') {
			paddle.stop();
		}
	}

	private updatePaddlePositions(deltaTime: number): void {
		if (this.targetPaddlePositions) {
			const currentTime = Date.now();
			const timeElapsed = currentTime - this.lastScoreTime;
			
			// Reset paddles instantly at the midpoint of countdown
			if (timeElapsed >= this.SCORE_DELAY / 2) {
				this.resetPaddles();
				this.targetPaddlePositions = null;
			}
		}
	}

	private checkCollisions(): void {
		const ballPos = this.ball.getPosition();
		const ballSize = this.ball.getSize();
		const ballVel = this.ball.getVelocity();

		// Check paddle collisions
		[this.player1Paddle, this.player2Paddle].forEach((paddle) => {
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
				const hitSide = isPlayerPaddle
					? ballPos.x + ballSize / 2 <= paddlePos.x + paddleSize.width / 4
					: ballPos.x - ballSize / 2 >= paddlePos.x + (paddleSize.width * 3) / 4;

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

	private checkScore(): void {
		const ballPos = this.ball.getPosition();
		const ballSize = this.ball.getSize();
		const currentTime = performance.now();

		// Only check for scoring if we're not waiting for ball spawn
		if (!this.isWaitingForBallSpawn) {
			if (ballPos.x - ballSize / 2 <= 0) {
				this.score.incrementOpponent();
				this.lastScoreTime = currentTime;
				this.ball.hide();
				this.isWaitingForBallSpawn = 3;
				this.startPaddleReset();
			} else if (ballPos.x + ballSize / 2 >= 800) {
				this.score.incrementPlayer();
				this.lastScoreTime = currentTime;
				this.ball.hide();
				this.isWaitingForBallSpawn = 3;
				this.startPaddleReset();
			}
		}

		// Добавляем обратный отсчет
		this.setCountDown(currentTime);

		if (this.score.hasWinner()) {
			this.stopGame();
		}
	}

	private setCountDown(currentTime: number) {
		if (this.isWaitingForBallSpawn > 0) {
			const timeElapsed = currentTime - this.lastScoreTime;
			const segmentDuration = this.SCORE_DELAY / 4; // Делим на 3 сегмента


			// Обновляем значение счетчика в зависимости от прошедшего времени
			if (timeElapsed < segmentDuration) {
				// Первая треть времени - значение 3
				this.isWaitingForBallSpawn = 4;
			} else if (timeElapsed < segmentDuration * 2) {
				// Вторая треть времени - значение 2
				this.isWaitingForBallSpawn = 3;
			} else if (timeElapsed < segmentDuration * 3) {
				// Последняя треть времени - значение 1
				this.isWaitingForBallSpawn = 2;
			} else if (timeElapsed < this.SCORE_DELAY) {
				// Последняя треть времени - значение 1
				this.isWaitingForBallSpawn = 1;
			} else {
				// По истечении всего времени, сбрасываем мяч
				console.log('RESET BOLL');
				this.resetBall();
				// this.lastScoreTime = 0;
				this.isWaitingForBallSpawn = 0;
				this.targetPaddlePositions = null;
			}
		}
	}

	public stopGame(): void {
		this.gameState = 'GAME_OVER';
	}

	private resetBall(): void {
		this.ball.reset();
	}

	private resetPaddles(): void {
		this.player1Paddle.reset(600);
		this.player2Paddle.reset(600);
	}

	private startPaddleReset(): void {
		// Just set the flag to trigger reset at midpoint
		this.targetPaddlePositions = { player: 0, computer: 0 };
	}
}