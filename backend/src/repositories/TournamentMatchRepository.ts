import { PrismaClient, TournamentMatch, MatchStatus } from "@prisma/client";
import { TournamentMatchDto } from "../dtos/TournamentMatchDto";

const prisma = new PrismaClient();

export class TournamentMatchRepository {
	async create(data: TournamentMatchDto): Promise<TournamentMatch> {
		return prisma.tournamentMatch.create({ data});
	}

	async createBatch(data: TournamentMatchDto[]): Promise<TournamentMatch[]> {
		return prisma.$transaction(
			data.map((match) =>  prisma.tournamentMatch.create({ data: match}))	
		);
	}

	async findById( id: number): Promise<TournamentMatch | null> {
		return prisma.tournamentMatch.findUnique({ where: { id}});
	}

	async findByMatchId( matchId: number): Promise<TournamentMatch | null> {
		return prisma.tournamentMatch.findUnique({ 
			where: { matchId},
			include: { match: true}
		});
	}

	// async updateWinner(id: number, winnerId: number): Promise<TournamentMatch> {
	// 	return prisma.tournamentMatch.update({
	// 		where: { id },
	// 		data: { winnerId }
	// 	});
	// }

	async updateNextMatch(id: number, nextMatchId: number): Promise<TournamentMatch> {
		return prisma.tournamentMatch.update({
			where: { id },
			data: { nextMatchId }
		});
	}

	async findAllByTournament(tournamentId: number): Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { tournamentId},
			orderBy: [
				{round: 'asc'},
				{ bracketPos: 'asc'}
			],
			include: { match: true}
		});
	}

	async findByTournamentAndRound(tournamentId: number, round: number): 
		Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { tournamentId, round},
			orderBy: { bracketPos: 'asc'},
			include: { match: true}
		});
	}

	async findUnfinishedMatchesByTournament(tournamentId: number): 
		Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { 
				tournamentId, 
				match: {status: {in: [MatchStatus.PENDING, MatchStatus.ONGOING]}}},
			include: { match: true}
		});
	}

	async findPendingMatchesByRound(tournamentId: number, round: number): 
		Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { 
				tournamentId, 
				round,
				match: {status: MatchStatus.PENDING}},
			include: { match: true}
		});
	}

	async findNotCompletedMatchesByRound(tournamentId: number, round: number): 
		Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { 
				tournamentId, 
				round,
				match: { status: { not: MatchStatus.COMPLETED } } },
			include: { match: true}
		});
	}

	// async findCompletedMatchesWithoutNextMatch(tournamentId: number):
	// 	Promise<TournamentMatch[]> 
	// {
	// 	return prisma.tournamentMatch.findMany({ 
	// 		where: { 
	// 			tournamentId, 
	// 			nextMatchId: null,
	// 			match: {status: MatchStatus.COMPLETED},
	// 			winnerId: { not: null }
	// 		},
	// 		include: { match: true}
	// 	});
	// }

	async updateStatus(id: number, status: MatchStatus): Promise<TournamentMatch> {
		return prisma.$transaction(async ts => {
			await ts.match.update({
				where: { id: (await ts.tournamentMatch.findUnique({
					where: {id}
				}))?.matchId},
				data: {status}
			});
			return ts.tournamentMatch.update({ where: { id}, data: {}});
		});		
	}

	async delete(id: number): Promise<TournamentMatch> {
		return prisma.tournamentMatch.delete({ where: { id}});
	}
}