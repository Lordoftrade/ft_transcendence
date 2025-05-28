export interface TournamentParticipantDto {
	tournamentId: number;
	userId: number;
	tournamentName?: string;
}

export interface RegisterParticipantDto {
	tournamentName?: string;
}