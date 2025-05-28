import { MessageType, TournamentParticipant } from "@prisma/client";
import { ChatService } from "./ChatService";

export class TournamentChatNotifier {
	constructor(
		private chatService = new ChatService(),
		private type = MessageType.TOURNAMENT) {}

	async notifyTournamentStart(
		participants: TournamentParticipant[], tournamentName: string): Promise<void> 
	{
		const message = 
			`The tournament "${tournamentName}" has started! 
			Good luck to all participants!`;
		await this.notifyTournamentParticipants(participants, message);
	}

	// async notifyMatchResult(tournamentId: number, matchResult: string): Promise<void> {
	// 	const message = `Match result: ${matchResult}`;
	// 	await this.chatService.sendSystemMessage(tournamentId, message, this.type);
	// }

	async notifyTournamentRegistration(
		participants: TournamentParticipant[], 
		userTournamentName: string, 
		tournamentName: string) 
	{
		const message = 
			`${userTournamentName} has registered for the tournament 
			${tournamentName}`;
		this.notifyTournamentParticipants(participants, message);
	}

	async notifyTournamentCompletion(
		winnerId: number,
		participants: TournamentParticipant[],
		tournamentName: string): Promise<void> 
	{
		const message =
			`Поздравляем! Вы победили в турнире "${tournamentName}"!`;

		await this.chatService.sendSystemMessage(
			winnerId,
			message,
			MessageType.TOURNAMENT);

		const winnerName = participants.find(
			p => p.userId === winnerId)?.tournamentName || 'Неизвестный игрок';

		for (const participant of participants) {
			if (participant.userId !== winnerId) {
				await this.chatService.sendSystemMessage(
					participant.userId,
					`Турнир "${tournamentName}" завершен. Победитель: ${winnerName}`,
					MessageType.TOURNAMENT
				);
			}
		}
	}
	

	private async notifyTournamentParticipants(
		participants: TournamentParticipant[], message: string): Promise<void>
	{
		for (const participant of participants) {
			try {
				await this.chatService
					.sendSystemMessage(participant.userId, message, this.type);
			}
			catch (err: any) {
				// Добавляем более подробное логирование
				console.warn(
					`Failed to send system message to user ${participant.userId}: ${err.message}`,
					err
				);
				// Продолжаем с другими участниками
			}
		}
	}
}