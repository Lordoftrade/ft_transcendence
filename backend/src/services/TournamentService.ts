import { TournamentDto as TournamentDto } from "../dtos/TournamentDto";
import { TournamentParticipantRepository } from "../repositories/TournamentParticipantRepository";
import { TournamentRepository } from "../repositories/TournamentRepository";
import { MatchStatus, Tournament, TournamentMatch, TournamentParticipant, TournamentStatus } from "@prisma/client";
import { TournamentMatchService } from "./TournamentMatchService";
import { TournamentChatNotifier } from "./TournamentChatNotifier";
import { TournamentParticipantService } from "./TournamentParticipantService";
import { RegisterParticipantDto } from "../dtos/TournamentParticipantDto";
import { TournamentBracketService } from "./TournamentBracketService";
import { TournamentMatchRepository } from "../repositories/TournamentMatchRepository";
import { MatchRepository } from "../repositories/MatchRepository";
import { MatchWebSocketService } from "./MatchWebsocketService";

export interface CreateTournamentDto extends TournamentDto {
	requiredPlayers: number;
}

export class TournamentService {
	constructor(
		private tournamentRepo = new TournamentRepository(),
		private participantService = new TournamentParticipantService(),
		private tmService = new TournamentMatchService(),
		private notifier = new TournamentChatNotifier(),
		private bracketService = new TournamentBracketService(),
		private tmmRepo = new TournamentMatchRepository(),
		private matchRepo = new MatchRepository()
		) {}

	async createTournament(data: CreateTournamentDto): Promise<Tournament> {
		//Players amount validation - only 4, 8 or 16 players allowed
		if (![4, 8, 16].includes(data.requiredPlayers)) {
			throw new Error("Invalid number of players. Only 4, 8 or 16 are allowed.");
		}
		return this.tournamentRepo.create(data);
	}

	async registerParticipant(
		tournamentId: number, userId: number, dto: RegisterParticipantDto):
		Promise<TournamentParticipant>
	{
		const tournament = await this.tournamentRepo.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		const participant = await this.participantService
			.register(tournamentId, userId, dto);
		
		const participants = await this.participantService
			.listParticipants(tournamentId); 

		if (participants.length === tournament.requiredPlayers) {
			await this.tournamentRepo
				.updateStatus(tournamentId, TournamentStatus.PENDING);
		}

		return participant;
	}

	async getTournament(id: number): Promise<Tournament| null > {
		return this.tournamentRepo.findById(id);
	}

	async listTournaments(): Promise<Tournament[]> {
		return this.tournamentRepo.findAll();
	}
	
	async getActiveTournaments(): Promise<Tournament[]> {
		return this.tournamentRepo.findActive();
	}

	async updateTournament(id: number, updates: TournamentDto): Promise<Tournament> {
		//TODO: проверка наличия турнира, права доступа, валидация
		return this.tournamentRepo.update(id, updates);
	}

	async removeTournament(id: number): Promise<Tournament> {
		return this.tournamentRepo.delete(id);
	}

	async chechAndUpdateTournamentStatus(): Promise<Tournament[]> {
		
		const readyTournaments: Tournament[] = [];
		const tournaments: Tournament[] = 
			await this.tournamentRepo.findNotCompleted();

		for (const tournament of tournaments) {
			let participants = await this.participantService
				.listParticipants(tournament.id);
			switch (tournament.status) {
				case TournamentStatus.PENDING:
					this.notifier
						.notifyTournamentStart(participants, tournament.name);
					await this.tournamentRepo
						.updateStatus(tournament.id, TournamentStatus.READY);
					break;
				case TournamentStatus.READY:
					participants = await this.participantService
						.listParticipants(tournament.id);
					await this.bracketService.generateBracket(
						tournament.id, participants.map(p => p.userId));
					await this.tournamentRepo
						.updateStatus(tournament.id, TournamentStatus.ONGOING);
					
					break;
				case TournamentStatus.ONGOING:
					await this.checkNextRound(tournament);
					break;
			}
		}
		return readyTournaments;
	}

	private async checkNextRound(tournament: Tournament): Promise<void> {
		const currentRound = tournament.currentRound;

		const notCompleted = await this.tmmRepo
			.findNotCompletedMatchesByRound(tournament.id, currentRound);

		if (notCompleted.length === 0) {
			const completed = await this.tmmRepo
			.findByTournamentAndRound(tournament.id, currentRound);
			for (const completedMatch  of completed) {
				const match = await this.matchRepo.findById(completedMatch.matchId);
				await this.advanceWinnerToNextRound(tournament, 
					completedMatch, match?.winnerId!);	
				}
			this.updateTournamentRound(tournament.id, currentRound + 1);
		}
	}

	async advanceWinnerToNextRound(
		tournament: Tournament, tm: TournamentMatch, winnerId: number): Promise<void>
	{
		//обработка финального матча
		if (!tm.nextMatchId) {
			this.setTournamentWinner(tournament, winnerId);
			return;
		}

		const nextMatch = await this.tmmRepo.findById(tm.nextMatchId);
		if (!nextMatch)
			throw new Error('Next match not found');

		const isPlayer1InNextMatch = tm.bracketPos % 2 === 1;

		if (isPlayer1InNextMatch) {
			await this.matchRepo.updatePlayer1(nextMatch.id, winnerId);
		}
		else {
			await this.matchRepo.updatePlayer2(nextMatch.id, winnerId);
		}
	}

	// Финальное уведомление при завершении турнира
	async finalizeTournament(tournamentId: number, winnerId: number): Promise<void> {
	}

	async updateTournamentRound(tournamentId: number, round: number): 
		Promise<Tournament> 
	{
		return this.tournamentRepo.updateCurrentRound(tournamentId, round);
	}

	async setTournamentWinner(tournament: Tournament,  winnerId: number):
		Promise<void>
	{
		this.tournamentRepo.updateWinner(tournament.id, winnerId);

		// Уведомление победителю
		const participants = await new TournamentParticipantRepository()
			.findByTournament(tournament.id);
		await this.notifier.notifyTournamentCompletion(
			winnerId,
			participants,
			tournament.name
		);
	}

	async getBracket(tournamentId: number): Promise<TournamentMatch[]> {
			return this.tmmRepo.findAllByTournament(tournamentId);
	}
	// async checkTournamentStatus(tournamentId: number): 
	// 	Promise<{isReady: boolean, playersCount: number, requiredPlayers: number}> 
	// {
	// 	const tournament = await this.tournamentRepo.findById(tournamentId);
	// 	if (!tournament) {
	// 		throw new Error("Tournament not found");
	// 	}

	// 	const participants = await this.participantService
	// 		.listParticipants(tournamentId);
	// 	const isReady = participants.length >= tournament.requiredPlayers;

	// 	return {
	// 		isReady,
	// 		playersCount: participants.length,
	// 		requiredPlayers: tournament.requiredPlayers,
	// 	};
	// }

}