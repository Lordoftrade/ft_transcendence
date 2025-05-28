import { PrismaClient, TournamentParticipant } from "@prisma/client";

const prisma = new PrismaClient();

export class TournamentParticipantRepository {
	async register(tournamentId: number, userId: number, tournamentName?: string): 
		Promise<TournamentParticipant> 
	{
		return prisma.tournamentParticipant.create({
			data: { tournamentId, userId, tournamentName}
		});
	}

	async findByTournament( tournamentId: number): Promise<TournamentParticipant[]> {
		return prisma.tournamentParticipant.findMany({
			where: { tournamentId},
			include: {
				user: {
					select: {
						id: true,
						username: true
					}
				}
			}
		});
	}

	async findByUser(tournamentId: number, userId: number): 
		Promise<TournamentParticipant | null> 
	{
		return prisma.tournamentParticipant.findUnique({
			where: {tournamentId_userId: { tournamentId, userId }} 
		});
	}

	async remove(tournamentId: number, userId: number): Promise<TournamentParticipant> {
		return prisma.tournamentParticipant.delete({
			where: { tournamentId_userId: {tournamentId, userId}}
		});
	}
}