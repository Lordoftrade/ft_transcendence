// import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// import { TournamentMatchService } from "../../services/TournamentMatchService";
// import { TournamentParticipantService } from "../../services/TournamentParticipantService";

// export class TournamentMatchController {
// 	private tmService = new TournamentMatchService();
// 	private participantService = new TournamentParticipantService();

// 	constructor(
// 		private fastify: FastifyInstance
// 	){}

// 	public registerSecureRoutes(): void {
// 		this.fastify.post('/:id/start', this.startTournament.bind(this));
// 		this.fastify.post('/:tId/match/:mId/complete', this.complete.bind(this));
// 		this.fastify.post('/:tId/match/:mId/technical-win', this.technicalWin.bind(this));
// 	}

// 	public registerRoutes(): void {
// 		this.fastify.get('/:id/bracket', this.bracket.bind(this));
// 		this.fastify.get('/:id/current-matches', this.currentMatches.bind(this));
// 		this.fastify.get('/:tId/match/:mId', this.getMatch.bind(this));
// 	}

// 	private async startTournament(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentId = Number((req.params as any).id);

// 		try { 
// 			const participants = 
// 				await this.participantService.listParticipants(tournamentId);
// 			const participantIds = participants.map(p => p.id);

// 			const bracket = await this.tmService
// 				.generateBracket(tournamentId, participantIds);
// 			reply.status(201).send(bracket);
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}

// 	private async bracket(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentId = Number((req.params as any).id);

// 		try {
// 			const bracket = await this.tmService.getBracket(tournamentId);
// 			reply.send(bracket);
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}

// 	private async complete(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentMatchId = Number((req.params as any).mId);
// 		const { result } = req.body as { result: string};
// 		try { 
// 			const updated = await this.tmService
// 				.completeMatch(tournamentMatchId, result);
// 			reply.send(updated);
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}

// 	private async technicalWin(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentMatchId = Number((req.params as any).mId);
// 		const { winnerId } = req.body as { winnerId: number};
// 		try {
// 			const updated = await this.tmService
// 				.awardTechnicalWin(tournamentMatchId, winnerId);
// 			reply.send(updated);
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}

// 	private async currentMatches(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentId = Number((req.params as any).id);
// 		try {
// 			// await this.tmService.checkInactiveParticipants(tournamentId);

// 			const nextRoundMatches = 
// 				await this.tmService.checkAndStartNextRoundMatches(tournamentId);

// 			const bracket = await this.tmService.getBracket(tournamentId);
// 			reply.send({ bracket, nextRoundMatches });
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}

// 	private async getMatch(req: FastifyRequest, reply: FastifyReply) {
// 		const tournamentId = Number((req.params as any).mId);
// 		const matchId = Number((req.params as any).mId);
// 		try {
// 			const tournamentMatch = await this.tmService.getTournamentMatch(matchId);
// 			if (!tournamentMatch || tournamentMatch.tournamentId !== tournamentId)
// 				return reply.status(400).send({ message: 'Tournament match not found'});
// 			reply.send(tournamentMatch);
// 		} catch (err) {
// 			const msg = err instanceof Error ? err.message : 'Error';
// 			reply.status(400).send({ message: msg});
// 		}
// 	}
// }