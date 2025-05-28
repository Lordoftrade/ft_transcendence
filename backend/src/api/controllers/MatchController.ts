import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MatchRepository } from '../../repositories/MatchRepository'

export class MatchController {
	private matchRepo = new MatchRepository();

	constructor(private fastify: FastifyInstance) {}

	public registerRoutes(): void {
		this.fastify.get('/:id', this.getMatch.bind(this));
		this.fastify.post('/:id/complete', this.completeMatch.bind(this));
		this.fastify.post('/invite/:otherId', this.invite.bind(this));
	}


	private async getMatch(req: FastifyRequest, reply:FastifyReply) {
		try {
			const matchId = Number((req.params as any).id);
			const match = await this.matchRepo.findById(matchId);
			if (!match)
				return reply.status(404).send({ message: 'Match not found' });
			reply.send(match);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg });
		}
	}

	private async completeMatch(req: FastifyRequest, reply: FastifyReply) {
		try {
			const matchId = Number((req.params as any).id);
			const { result: winnerId } = req.body as { result: number };
			const match = await this.matchRepo.completeMatch(matchId, winnerId);
			reply.send(match);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

  private async invite(req: FastifyRequest, reply: FastifyReply) {
    const userId    = (req.user as any).id as number;
    const otherId   = Number((req.params as any).otherId);
    try {
      const match = await this.matchRepo.createMatch(userId, otherId);
      // возвращаем именно { matchId }
      reply.status(201).send({ matchId: match.id });
    } catch (err: any) {
      reply.status(400).send({ message: err.message });
    }
  }
}