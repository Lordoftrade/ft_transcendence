import { FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import { TournamentService, CreateTournamentDto } from '../../services/TournamentService';
import { parseTournamentDto } from '../../utils/parseTournamentDto';
import { RegisterParticipantDto } from '../../dtos/TournamentParticipantDto';

export class TournamentController {
	private tournamentService = new TournamentService();

	constructor(
		private fastify: FastifyInstance
	) {}

	public registerSecureRoutes(): void {
		this.fastify.post('', this.createTournament.bind(this));
		this.fastify.put('/:id', this.updateTournament.bind(this));
		this.fastify.delete('/:id', this.removeTournament.bind(this));
		// this.fastify.get('/:id/status', this.checkTournamentStatus.bind(this));
		this.fastify.post('/:id/register', this.registerParticipant.bind(this));
	}

	public registerRoutes(): void {
		this.fastify.get('/:id', this.getTournament.bind(this));
		this.fastify.get('', this.listTournament.bind(this));
		this.fastify.get('/:id/bracket', this.bracket.bind(this));
	}

	private async createTournament(req: FastifyRequest, reply: FastifyReply) {
		try {
			const baseDto = parseTournamentDto(req.body as any);
			const requiredPlayers = parseInt((req.body as any).requiredPlayers || '8', 10);

			if (![4, 8, 16].includes(requiredPlayers)) 
				return reply.status(400).send({ message: 
					'Required players must be 4, 8 or 16' });
			
			const dto: CreateTournamentDto = {
				...baseDto,
				requiredPlayers
			};

			const tournament = await this.tournamentService.createTournament(dto);
			reply.status(201).send(tournament);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async registerParticipant(req: FastifyRequest, reply: FastifyReply) {
		try {
			const tournamentId = Number((req.params as any).id);
			const userId = (req.user as any).id;
			const dto = req.body as RegisterParticipantDto;
			dto.tournamentName ??= (req.user as any).username;
			const part = await this.tournamentService
				.registerParticipant(tournamentId, userId, dto);
			reply.status(201).send(part);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async getTournament(req: FastifyRequest, reply: FastifyReply) {
		try {
		const id = Number((req.params as any).id);
		const tournament = await this.tournamentService.getTournament(id);
		if (!tournament)
			return reply.status(400).send({ message: 'Tournament not found'});
		reply.send(tournament);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async listTournament(req: FastifyRequest, reply: FastifyReply) {
		try {
		const tours = await this.tournamentService.listTournaments();
		reply.send(tours);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async updateTournament(req: FastifyRequest, reply: FastifyReply) {
		try {
			const id = Number((req.params as any).id);
			const dto = parseTournamentDto(req.body as any);
			const tour = await this.tournamentService.updateTournament(id, dto);
			reply.send(tour);
		} catch (err){
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async removeTournament(req: FastifyRequest, reply: FastifyReply) {
		try {
			const id = Number((req.params as any).id);
			const tour = await this.tournamentService.removeTournament(id);
			reply.send(tour);
		}
		catch (err){
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async bracket(req: FastifyRequest, reply: FastifyReply) {
		try {
			const tournamentId = Number((req.params as any).id);
			const bracket = await this.tournamentService.getBracket(tournamentId);
			reply.send(bracket);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	// private async checkTournamentStatus(req: FastifyRequest, reply: FastifyReply) {
	// 	const id = Number((req.params as any).id);
	// 	try {
	// 		const status = await this.tournamentService.checkTournamentStatus(id);
	// 		reply.send(status);
	// 	}
	// 	catch (err) {
	// 		const msg = err instanceof Error ? err.message : 'Error';
	// 		reply.status(400).send({ message: msg});
	// 	}
	// }
}