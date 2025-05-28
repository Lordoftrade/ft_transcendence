import { PrismaClient, Tournament, TournamentStatus} from '@prisma/client'
import { TournamentDto as TournamentDto } from '../dtos/TournamentDto';

const prisma = new PrismaClient();

export class TournamentRepository {
	async create(data: TournamentDto): Promise<Tournament> {
		return prisma.tournament.create({ data});
	}

	async findById(id: number): Promise<Tournament | null> {
		return prisma.tournament.findUnique({ where: { id: id}});
	}

	async findAll(): Promise<Tournament[]> {
		return prisma.tournament.findMany({ orderBy:  { startDate: 'asc'}, include: {
      participants: true,  // подтягиваем список участников
      matches:      true   // и, если нужно, сетку матчей
    }})
	}

	async findActive(): Promise<Tournament[]> {
		return prisma.tournament.findMany({
			where: { status: TournamentStatus.ONGOING },
			orderBy: { startDate: 'asc' }
		});
	}

	async update( id: number, data: TournamentDto): Promise<Tournament> {
		return prisma.tournament.update({ where: { id }, data});
	}

	async updateStatus(id: number, status: TournamentStatus): Promise<Tournament> {
		return prisma.tournament.update({ 
			where: { id }, 
			data: { status}
		});
	}

	async updateWinner(id: number, winnerId: number): Promise<Tournament> {
		return prisma.tournament.update({
			where: { id },
			data: { winnerId,
				status: TournamentStatus.COMPLETED
			 }
		});
	}

	async updateCurrentRound(id: number, currentRound: number): Promise<Tournament> {
		return prisma.tournament.update({
			where: { id },
			data: { currentRound }
		});
	}

	findTournamentReadyToStart(): Promise<Tournament[]> {
		return prisma.tournament.findMany({
			where: {
				status: TournamentStatus.REGISTRATION,
				startDate: {lte: new Date() }
			},
			include: { participants: true }
		});
	}

	findNotCompleted(): Promise<Tournament[]> {
		return prisma.tournament.findMany({
			where: {
				status: { not: TournamentStatus.COMPLETED },
				startDate: {lte: new Date() }
			},
			include: { participants: true }
		});
	}

	async delete(id: number): Promise<Tournament> {
		return prisma.tournament.delete({ where: { id}});
	}
}