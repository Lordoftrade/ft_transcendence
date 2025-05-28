import { TournamentParticipantRepository } from 
	"../repositories/TournamentParticipantRepository";
import { TournamentParticipant, TournamentStatus } from "@prisma/client";
import { RegisterParticipantDto}  from "../dtos/TournamentParticipantDto";
import { TournamentRepository } from "../repositories/TournamentRepository";
import { ChatService } from "./ChatService";

export class TournamentParticipantService {
	constructor(
		private participantRepo = new TournamentParticipantRepository(),
		private tournamentRepo = new TournamentRepository(),
		private chatService = new ChatService()
	) {}

	async register(tournamentId: number, userId: number, dto?: RegisterParticipantDto): 
		Promise<TournamentParticipant> 
	{
		const tournament = await this.tournamentRepo.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		if (tournament.status !== TournamentStatus.REGISTRATION) {
			throw new Error("Tournament registration is closed");
		}
		
		const existing = await this.participantRepo.findByUser(userId, tournamentId);
		if (existing) {
			throw new Error("User is already registered for this tournament");
		}

		const tournamentName = dto?.tournamentName;
		const participant =  this.participantRepo
			.register(tournamentId, userId, tournamentName);
		
		return participant;
	}

	async unregister(tournamentId: number, userId: number): Promise<TournamentParticipant> {
		//TODO: проверка статуса турнира и прав
		return this.participantRepo.remove(tournamentId, userId);
	}

	async listParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
		return this.participantRepo.findByTournament(tournamentId);
	}
}