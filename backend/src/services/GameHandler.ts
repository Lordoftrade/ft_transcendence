import { Game } from "../pong/Game";
import { WebSocket } from '@fastify/websocket';
import { GamesStateDto } from "../pong/GamesStateDto";
import { SocketWithUser } from "./MatchWebsocketService";

export class GameHandler {
	private clients: Map<number, SocketWithUser> = new Map();
	private gameInterval: NodeJS.Timeout | null = null;
	private game: Game;
	private playersReady: Set<number> = new Set();
	private isGameCompleted: boolean = false;
	private winnerId: number | null = null;
	private loserId: number | null = null;

	constructor() {
		this.game = new Game();
	}

	public addClient(playerId: number, socket: SocketWithUser): void {
		this.clients.set(playerId, socket);
	}

	public getIsGameCompleted(): boolean {
		return this.isGameCompleted;
	}

	public getWinnerId(): number | null {
		return this.winnerId;
	}

	public setWinnerId(winnerId: number | null): void {
		this.winnerId = winnerId;
	}
	
	public getLoserId(): number | null {
		return this.loserId;
	}

	public setLoserId(loserId: number | null): void {
		this.loserId = loserId;
	}

	public handleClientMessage(playerId: number, playerNumber: number, data: any): void {
		// const data = JSON.parse(message);
		
		switch (data.type) {
			case 'ready':
				this.markPlayerReady(playerId);
				break;
			case 'move':
				if (data.direction && typeof data.direction === 'string') 
					this.game.handlePlayerInput(data.direction, playerNumber);
				break;
			case 'start':
				this.startGame();
				break;
			case 'pause':
				this.pauseGame();
				break;
			case 'resume':
				this.resumeGame();
				break;
			case 'reset':
				this.resetGame();
				break;
			default:
				break;
		}
	}

	public markPlayerReady(playerId: number): void {
		this.playersReady.add(playerId);

		//Оповещаем всех игроков о новом статусе готовности
		const readyStatus = {
			type: 'readyStatus',
			playersReady: Array.from(this.playersReady),
			allReady: this.playersReady.size === 2
		};

		this.clients.forEach((client) => 
			client.send(JSON.stringify(readyStatus)));

		//Если все игроки готовы, запускаем игру
		if (this.playersReady.size === 2) {
			//Отправляем сообщение о начале игры
			const gameStartMessage = {
				type: 'gameStart',
				timeStamp: Date.now()
			};

			this.clients.forEach((client) => {
				client.send(JSON.stringify(gameStartMessage));
			});

			//Начинаем игру с небольшой задержкой
			setTimeout(() => {
				this.startGame();
			}, 1000);
		}
	}

	private startGame(): void {
		if (this.gameInterval) return;
		
		this.game.start();

		this.gameInterval = setInterval(() => {
			this.game.updateState(0.017); // 17 ms
			const state = this.game.getState();
			if (state.gameState === 'GAME_OVER' && state.winnerId) {
				this.stopGame();
				this.defineWinnerAndLoser(state.winnerId);
			}
			this.broadcastGameState(state);
		}, 17);
	}

	private defineWinnerAndLoser(winnerPlayerNumber: number): void {
		const players = Array.from(this.clients.keys());
		for (const playerId of players) {
			if (this.clients.get(playerId)?.playerNumber === winnerPlayerNumber)
				this.winnerId = playerId;
			else
				this.loserId = playerId;
		}
	}


//под вопросом
	public stopGame(): void {
		this.isGameCompleted = true;
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}

		const gameStopMessage = {
			type: 'gameStop',
			timeStamp: Date.now()
		};
		this.clients.forEach((client) => {
			client.send(JSON.stringify(gameStopMessage));
		});
		this.playersReady.clear();
	}

	private broadcastGameState(state:GamesStateDto): void {
		try {
			const stateString = JSON.stringify(state);
			this.clients.forEach((client) => {
				try {
					client.send(stateString);
				}
				catch (error) {
					console.error("Error sending game state to client:", error);
				}
			});
		}
		catch (error) {
			console.error("Error broadcasting game state:", error);
		}
	}

	public pauseGame(): void {
		this.game.pause();
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}
	}

	public resumeGame(): void {
		this.startGame();
	}

	public resetGame(): void {
		this.game.reset();
	}

}