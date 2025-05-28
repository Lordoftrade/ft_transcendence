import { Match, TournamentMatch } from "@prisma/client";
import { MatchRepository } from "../repositories/MatchRepository";
import { TournamentMatchRepository } from "../repositories/TournamentMatchRepository";

export class TournamentBracketService {
	constructor(
		private tmRepo = new TournamentMatchRepository(),
		private matchRepo = new MatchRepository(),
	) {}

	async generateBracket(tournamentId: number, participantIds: number[]): 
		Promise<TournamentMatch[]> 
	{
		const playersCount = participantIds.length;
		const roundOneMatches = 
			await this.createFirstRoundMatches(tournamentId, participantIds);
		
		console.log(`ROUND 1 MATCHES CREATED: ${roundOneMatches.length}`);
		
		const totalRounds = Math.log2(playersCount);
		console.log(`TOTAL ROUNDS: ${totalRounds}`);
		let allMatches = [...roundOneMatches];

		for (let round = 2; round <= totalRounds; round++) {
			const matchesInRound = playersCount / Math.pow(2, round);
			const roundMatches = await this
				.createEmptyRoundMatches(tournamentId, round, matchesInRound);
			console.log(`ROUND ${round} MATCHES CREATED: ${roundOneMatches.length}`);
			allMatches = [...allMatches, ...roundMatches];
		}

		await this.connectMatchesInBracket(tournamentId, playersCount);

		return allMatches;
	}

	private async createFirstRoundMatches(
		tournamentId: number, participantIds: number[]): Promise<TournamentMatch[]> 
	{
		const matches = await Promise.all(
			participantIds.reduce(
				(acc, userId, idx, arr) => {
					if (idx % 2 === 1) {
						const p1 = arr[idx - 1];
						const p2 = arr[idx];
						acc.push(this.matchRepo.createMatch(p1, p2));
					}
					return acc;
				},
				[] as Promise<Match>[]
			)
		);

		const tmEntries = await Promise.all(
			matches.map(async (m, idx) => {
				return this.tmRepo.create({
					tournamentId,
					matchId: m.id,
					round: 1,
					bracketPos: idx + 1
				});
			})
		);

		return tmEntries;
	}

	private async createEmptyRoundMatches(
		tournamentId: number, round: number, matchCount: number): Promise<TournamentMatch[]> 
	{
		const matchesData = [];

		for (let i = 0; i < matchCount; i++) {
			const emptyMatch = await this.matchRepo.createEmptyMatch();
			matchesData.push({
				tournamentId,
				matchId: emptyMatch.id,
				round,
				bracketPos: i + 1
			});
		}
		return this.tmRepo.createBatch(matchesData)
	}

	private async connectMatchesInBracket(tournamentId: number, requiredPlayers: number): 
		Promise<void>
	{
		const allMatches = await this.tmRepo.findAllByTournament(tournamentId);
		const matchesByRound = new Map<number, TournamentMatch[]>();

		//Группируем матчи по раундам
		allMatches.forEach((match) => {
			if (!matchesByRound.has(match.round)) {
				matchesByRound.set(match.round, []);
			}
			matchesByRound.get(match.round)?.push(match);
		});

		const totalRounds = Math.log2(requiredPlayers);

		//Для каждого раунда, кроме последнего
		for (let round = 1; round < totalRounds; round++) {
			const currentRoundMatches = matchesByRound.get(round) || [];
			const nextRoundMatches = matchesByRound.get(round + 1) || [];

			//связываем матчи с матчами следующего раунда
			for (let i = 0; i < currentRoundMatches.length; i += 2) {
				const nextRoundIndex = Math.floor(i / 2);
				if (nextRoundIndex < nextRoundMatches.length) {
					const nextRoundMatchId = nextRoundMatches[nextRoundIndex].id;

					// Обновление первого матча пары
					await this.tmRepo
						.updateNextMatch(currentRoundMatches[i].id, nextRoundMatchId);

					// Обновление второго матча пары
					if (i + 1 < currentRoundMatches.length) {
						await this.tmRepo.updateNextMatch(
							currentRoundMatches[i + 1].id, nextRoundMatchId);
					}
				}
			}
		}
	}

}