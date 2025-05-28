import { TournamentMatchRepository } from "../repositories/TournamentMatchRepository"; 
import { TournamentRepository } from "../repositories/TournamentRepository";
import { MatchRepository } from "../repositories/MatchRepository";
import { TournamentMatch, Match, MatchStatus, TournamentStatus, MessageType} from "@prisma/client";
import { TournamentBracketService } from "./TournamentBracketService";
import { MatchWebSocketService } from "./MatchWebsocketService";
import { ChatService } from "./ChatService";

export class TournamentMatchService {
	constructor(
		private tmRepo = new TournamentMatchRepository(),
		private matchRepo = new MatchRepository(),
		private tournamentRepo = new TournamentRepository(),
		private bracketService = new TournamentBracketService(),
		private chatService = new ChatService()
	) {}


	async getTournamentMatch(tournamentMatchId: number): Promise<TournamentMatch | null> {	
		const tm = await this.tmRepo.findById(tournamentMatchId);
		if (!tm)
			throw new Error('Tournament match not found');
		return tm;
	}


	// async getBracket(tournamentId: number): Promise<TournamentMatch[]> {
	// 	return this.tmRepo.findAllByTournament(tournamentId);
	// }

	// async completeMatch(tournamentMatchId: number, result: string): 
	// 	Promise<TournamentMatch> 
	// {
	// 	const tm = await this.tmRepo.findById(tournamentMatchId);
	// 	if (!tm)
	// 		throw new Error('Tournament match not found');

	// 	const updatedMatch = await this.matchRepo.completeMatch(tm.matchId, result);

	// 	const winnerId = this.determineWinner(updatedMatch);
	// 	if (!winnerId)
	// 		throw new Error('Could not determine winner');

	// 	await this.advanceWinnerToNextRound(tm.id, winnerId);

	// 	const updatedTm = await this.tmRepo.findById(tournamentMatchId);
	// 	if (!updatedTm)
	// 		throw new Error('Tournament match not found after update');

	// 	return updatedTm;
	// }


	private determineWinner(match: Match): number | null {
		if (!match.result) return null;

		const [score1, score2] = match.result.split('-').map(Number);

		if (score1 > score2) {
			return match.player1Id;
		} else if (score2 > score1) {
			return match.player2Id;
		} else {
			return null; // Draw
		}
	}




	
}