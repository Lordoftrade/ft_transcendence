import { PrismaClient, Match, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class MatchRepository{
	async createMatch(player1Id: number, player2Id: number): Promise<Match>{
		 return prisma.match.create({data: { player1Id: player1Id, player2Id: player2Id}});
	}

	async createEmptyMatch(): Promise<Match>{
		// Сначала найдем или создадим placeholder пользователя
		const placeholderUser = await this.getOrCreatePlaceholder();
		
		return prisma.match.create({
			data: {
				player1Id: placeholderUser.id,
				player2Id: placeholderUser.id,
				status: MatchStatus.PENDING,
				winnerId: placeholderUser.id // Устанавливаем winnerId в placeholderUser.id вместо -1
			}
		});
	}
	
	// Вспомогательный метод для получения placeholder пользователя
	private async getOrCreatePlaceholder() {
		const placeholderEmail = "tournament_placeholder@system.local";
		
		// Проверяем существование placeholder пользователя
		let placeholder = await prisma.user.findUnique({
			where: { email: placeholderEmail }
		});
		
		// Если не существует - создаем
		if (!placeholder) {
			placeholder = await prisma.user.create({
				data: {
					email: placeholderEmail,
					username: "TBD_Placeholder",
					password: "NOT_USED" // В реальном приложении лучше использовать более безопасный вариант
				}
			});
		}
		
		return placeholder;
	}

	async updateStatus(matchId: number,  newStatus: MatchStatus): Promise<Match> {
		return prisma.match.update({
			where: {id: matchId},
			data: {status: newStatus}
		});
	}

	async updatePlayer1(id: number, player1Id: number): Promise<Match> {
		return prisma.match.update({
			where: {id: id},
			data: {player1Id}
		});
	}

	async updatePlayer2(id: number, player2Id: number): Promise<Match> {
		return prisma.match.update({
			where: {id: id},
			data: {player2Id}
		});
	}

	async findById(matchId: number): Promise<Match | null> {
		return prisma.match.findUnique({
			where: {id: matchId}
		});
	}

	async completeMatch(matchId: number, winnerId: number): Promise<Match> {
		return prisma.match.update({
			where: {id: matchId},
			data: {
				status: MatchStatus.COMPLETED, 
				playedAt: new Date(),  
				winnerId}
		});
	}

	async  findByStatus(status: MatchStatus): Promise<Match[]> {
		return prisma.match.findMany({
			where: {status: status}
		});
	}

	async findByPlayer(userId: number): Promise<Match[]> {
		return prisma.match.findMany({
			where: {
				OR: [{player1Id: userId}, {player2Id: userId}]
			},
			orderBy: {startAt: 'desc'}
		});
	}

	async findByPlayerAndStatus(userId: number, status: MatchStatus): Promise<Match[]> {
		return prisma.match.findMany({
			where: {
				status: status,
				OR: [{player1Id: userId}, {player2Id: userId}]
			},
			orderBy: {startAt: 'desc'}
		});
	}
}