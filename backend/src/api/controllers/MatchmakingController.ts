import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { MatchmakingService } from "../../services/MatchmakingService";
import { Match, MatchStatus} from '@prisma/client'
import { REPL_MODE_SLOPPY } from "repl";

export class MatchmakingController {
	constructor(
		private fastify: FastifyInstance,
		private mmService = new MatchmakingService()
	) {}

	public registerProtectedRoutes(): void {
		this.fastify.post('/join', this.joinQueue.bind(this));
		this.fastify.post('/leave', this.leaveQueue.bind(this));
		this.fastify.get('/checkPending', this.checkForPendingMatch.bind(this))
		this.fastify.get('/:id/findMatch', this.findMatchForPlayer.bind(this));
	}

	public registerPublicRoutes(): void {
		this.fastify.post('/process', this.processQueue.bind(this));
	}

	private async joinQueue(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { id: userId} = req.user as any;
			await this.mmService.joinQueue(userId);
			reply.send({ message: 'Joined matchmaking queue'});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async leaveQueue(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { id: userId} = req.user as any;
			await this.mmService.leaveQueue(userId);
			reply.send({ message: 'Left matchmaking queue'});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async processQueue(req: FastifyRequest, reply: FastifyReply){
		try {
			const matches: Match[] = await this.mmService.processQueue();
			reply.send({ created: matches.length, matches});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(500).send({ message: msg});
		}
	}

	private async checkForPendingMatch(req: FastifyRequest, reply: FastifyReply) {
		try {
			const user = req.user as any
			const match = await this.mmService.findMatchForPlayer(user.id);
			if (!match)
				reply.send({found: false});
			else
				reply.send({found: true, matchId: match.id});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error in checkForPendingMatch';
			reply.status(500).send({ message: msg});
		}
	}

	private async findMatchForPlayer(req: FastifyRequest, reply: FastifyReply) {	
		try {
			const userId = (req.user as any).id as number;
			const match = await this.mmService.findMatchForPlayer(userId);
			if (!match) return null;
			if (match.status !== MatchStatus.PENDING) {
				throw new Error('Match is not pending');
			}
			reply.send(match);
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			throw new Error(msg);
		}
	}
}