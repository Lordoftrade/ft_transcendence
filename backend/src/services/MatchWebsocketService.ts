import { FastifyRequest } from 'fastify';
import { GameHandler as GameHandler } from './GameHandler';
import { MatchmakingService } from './MatchmakingService'
import { WebSocket } from '@fastify/websocket';
import { TournamentMatchService } from './TournamentMatchService';
import { Match, TournamentMatch } from '@prisma/client';
import { MatchRepository } from '../repositories/MatchRepository';
import { UserService } from './UserService';
import { Mutex } from 'async-mutex';

export type SocketWithUser = WebSocket & { 
	userId: number; matchId: number; playerNumber?: number };

const userMutex: Mutex = new Mutex();

export class MatchWebSocketService {
	private static instance: MatchWebSocketService;
	private rooms: Map<number, Set<SocketWithUser>> = new Map();
	private games: Map<number, GameHandler> = new Map();
	private matchRepo = new MatchRepository();
	private userService = new UserService();

	private userConnections: Map<number, {
		socketId: string,
		matchId: number,
		lastActivity: number,
		disconnectTimeout?: NodeJS.Timeout
	}> = new Map();

	private readonly RECONNECT_TIMEOUT = 60000; // 1 minute

	// Добавим отслеживание назначенных номеров игроков для каждого матча
	private playerNumbers: Map<number, Map<number, number>> = new Map(); // matchId -> [userId -> playerNumber]

	constructor(private matchService = new MatchmakingService())
	{
		MatchWebSocketService.instance = this;
	}

	public static getInstance(): MatchWebSocketService {
		// тут можно добавить проверку на существование экземпляра
		return MatchWebSocketService.instance;
	}

	public async handleNewConnection(socket: WebSocket, request: FastifyRequest) {
		try 
		{
			userMutex.runExclusive(async () => {
				const userId = (request.user as any).id;
				const matchId = await this.getMatchId(request, socket, userId);
				if (!matchId)
					return;

				//check is user was disconnected
				const existingConnection = this.userConnections.get(userId);
				if (existingConnection && existingConnection.disconnectTimeout) {
					clearTimeout(existingConnection.disconnectTimeout);
					console.log(`User ${userId} reconnected to match ${matchId}`);
				}

				//create unique socketId
				const socketId = `${userId}-${Date.now()}`;

				//register user connection
				this.userConnections.set(userId, {
					socketId,
					matchId,
					lastActivity: Date.now(),
					disconnectTimeout: undefined
				});

				const typedSocket = this.fillRoom(socket, userId, matchId);

				this.setupActivityTracking(typedSocket, userId);
				this.socketEventsSubscribtion(typedSocket);
				this.notifyOnConnection(typedSocket, userId, matchId, this.rooms.get(matchId)!);
			});
		}
		catch {
			(socket as WebSocket).close(1011, 'Unexpected error');
		}
	}

	private async getMatchId(
		request: FastifyRequest,
		socket: WebSocket,
		userId: number): Promise< number | undefined>
	{
		const matchIdParam = (request.query as any).matchId;
		if (!matchIdParam) {
			(socket as WebSocket).close(1008, 'No token or matchId');
			return;
		}

		//валидация matchId
		const matchId = parseInt(matchIdParam, 10);
		if (isNaN(matchId)) {
			socket.close(1008, 'Invalid matchId');
			return;
		}
		//проверка, что игрок действительно участвует в данном матче
		const isParticipant = await this.matchService.userHasMatch(userId, matchId);
		if (!isParticipant) {
			socket.close(1008, 'User not in this match');
			return;
		}

		return matchId;
	}

	private fillRoom(socket: WebSocket, userId: number, matchId: number): SocketWithUser {
		// Привязка полей к сокету
		const typedSocket = socket as SocketWithUser;
		typedSocket.userId = userId;
		typedSocket.matchId = matchId;

		// Добавляем сокет в комнату, комнату в словарь
		let room = this.rooms.get(matchId);
		if (!room) {
			room = new Set();
			this.rooms.set(matchId, room);

			// Создаем новый экземпляр GameService для этой комнаты
			const gameService = new GameHandler();
			this.games.set(matchId, gameService);
			
			this.playerNumbers.set(matchId, new Map());
		}
		typedSocket.playerNumber = this.getPlayerNumber(matchId, userId); // Изначально номер игрока не назначен
		
		// Добавляем сокет в комнату
		room.add(typedSocket);
		let game = this.games.get(matchId);
		game?.addClient(userId, typedSocket);

		return typedSocket;
	}
	
	// Метод для получения корректного номера игрока
	private getPlayerNumber(matchId: number, userId: number): number {
		let playerNumbersMap = this.playerNumbers.get(matchId);
		if (!playerNumbersMap) 
			throw new Error(`Match with ID ${matchId} not found`);
		
		// Если игрок уже имеет номер, вернем его
		if (playerNumbersMap.has(userId)) {
			return playerNumbersMap.get(userId)!;
		}
		
		// Иначе, найдем первый доступный номер (начиная с 1)
		const usedNumbers = new Set(playerNumbersMap.values());
		let playerNumber = 1;
		while (usedNumbers.has(playerNumber)) {
			playerNumber++;
		}
		
		// Сохраняем номер игрока
		playerNumbersMap.set(userId, playerNumber);
		return playerNumber;
	}

	private setupActivityTracking(socket: SocketWithUser, userId: number) {
		//update last activity time
		const originalOnMessage = socket.onmessage;
		const { MessageEvent } = require('ws');
		socket.onmessage = (event: InstanceType<typeof MessageEvent>) => {
			const connection = this.userConnections.get(userId);
			if (connection)
				connection.lastActivity = Date.now();

			if (originalOnMessage) {
				originalOnMessage.call(socket, event);
			}
		};

		//set ping for activity tracking
		const pingInterval = setInterval(() => {
			try {
				if (socket.readyState === socket.OPEN) {
					socket.send(JSON.stringify({ type: 'ping' }));
				} else {
					clearInterval(pingInterval);
				}
			} catch (error) {
				console.error('Error sending ping:', error);
				clearInterval(pingInterval);
			}
		}, 30000); // 30 seconds

		(socket as any)._pingInterval = pingInterval;
	}	

	private socketEventsSubscribtion(socket: SocketWithUser) {
		// Обработчик входящих сообщений
		socket.on('message', (rawMessage: string) => {
			this.handleIncomingMessage(socket, rawMessage);
		});

		// Обработка закрытия соединения
		socket.on('close', () => {
			if ((socket as any)._pingInterval) {
				clearInterval((socket as any)._pingInterval);
			}
			this.handleDisconnection(socket.userId);
			this.removeFromRoom(socket);
		});
	}

	private handleDisconnection(userId: number) {
		const connection = this.userConnections.get(userId);
		if (!connection) return;

		console.log(`User ${userId} disconnected from match ${connection.matchId}`);

		const disconnectionTimeout = setTimeout(async () => {
			console.log(
				`User ${userId} failed to reconnect in time, 
				declairing technical loss`);
				try {
					const game = this.games.get(connection.matchId);
					game?.stopGame();

					const match = await this.findMatchById(connection.matchId);
					if (!match) return;

					const winnerId = match.player1Id === userId 
						? match.player2Id
						: match.player1Id;

					game?.setWinnerId(winnerId);

					const sockets = this.rooms.get(connection.matchId);
					sockets?.forEach((s) => {
						this.removeFromRoom(s);
					});

					this.userConnections.delete(userId);
				} catch (error) {
					console.error('Error handling disconnection:', error);
				}
		}, this.RECONNECT_TIMEOUT);

		connection.disconnectTimeout = disconnectionTimeout;
	}

	private removeFromRoom(socket: SocketWithUser) {
		const matchId = socket.matchId;
		const room = this.rooms.get(socket.matchId);
		if (room) {
			room.delete(socket);
			const game = this.games.get(matchId);
			if (room.size === 0 && game?.getIsGameCompleted) {
				this.endGame(socket, game);
			} else {
				//if one player left
				if (room.size === 1) {
					const remainingPlayer = Array.from(room)[0];
					remainingPlayer.send(JSON.stringify({
						type: 'playerDisconnected',
						message: 'Your opponent has disconnected. Waiting for reconnection...',
					}));
				}
			}
		}
	}

	private endGame(socket: SocketWithUser, game: GameHandler) {
		this.rooms.delete(socket.matchId);
		this.games.delete(socket.matchId);
		userMutex.runExclusive(() => {
			this.playerNumbers.delete(socket.matchId); // Удаляем номера игроков
		});
		
		try {
			const winnerId = game.getWinnerId();
			if (!winnerId) 
				throw new Error('No winner found');
			const loserId = game.getLoserId();
			if (!loserId) 
				throw new Error('No loser found');
			this.matchRepo.completeMatch(socket.matchId, winnerId);
			this.userService.updateWins(winnerId);
			this.userService.updateLoses(loserId);
		}
		catch{
			console.log("CAN'T COMPLETE MATCH");
		}
	}

	private async findMatchById(matchId: number): Promise<Match | null> {
		const matchService = new MatchmakingService();
		return matchService.findMatchById(matchId);
	}

	// private async findTournamentMatchById(matchId: number): Promise<TournamentMatch | null> {
	// 	const tmService = new TournamentMatchService();
	// 	return tmService.getTournamentMatch(matchId);
	// }

	private notifyOnConnection(
		typedSocket: SocketWithUser,
		userId: number,
		matchId: number,
		room: Set<SocketWithUser>) 
	{
		
		typedSocket.send(JSON.stringify({
			type: 'connection',
			status: 'connected',
			playerId: userId,
			playerNumber: typedSocket.playerNumber, // Используем стабильный номер игрока
			roomId: matchId,
			playersConnected: room.size,
			playersNeeded: 2
		}));

		// Оповещаем других игроков о новом подключении
		for (const client of room) {
			if (client !== typedSocket) {
				client.send(JSON.stringify({
					type: 'playerConnected',
					playersConnected: room.size,
					playersNeeded: 2,
					newPlayerNumber: typedSocket.playerNumber // Сообщаем номер нового игрока
				}));
			}
		}

	}

	private handleIncomingMessage(socket: SocketWithUser, rawMessage: string) {
		let msg: any;
		try {
			msg = JSON.parse(rawMessage);
		} catch{
			return;
		}

		const room = this.rooms.get(socket.matchId);
		if (!room) return;

		const game = this.games.get(socket.matchId);
		if (!game) 
			return;

		try {
			game.handleClientMessage(socket.userId, socket.playerNumber!, msg);
		}
		catch (error) {
			socket.send(JSON.stringify({
				type: 'error',
				message: 'Invalid message format'
			}));
			return;
		}
	}

	public isUserConnectedToMatch(userId: number, matchId: number): boolean {
		const connection = this.userConnections.get(userId);
		if (!connection) return false;
		
		return connection.matchId === matchId && !connection.disconnectTimeout;
	}


}