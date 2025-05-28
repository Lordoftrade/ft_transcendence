import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { InvitationService } from "../../services/InvitationService";
import { PagingDto } from "../../dtos/PagingDto";

export class InvitationController {
	constructor(
		private fastify: FastifyInstance,
		private invService = new InvitationService()
	){}

	public registerSecureRoutes(){
		this.fastify.post('', this.sendInvite.bind(this));
		this.fastify.get('/incoming', this.listIncoming.bind(this));
		this.fastify.get('/outgoing', this.listOutgoing.bind(this));
		this.fastify.post('/:id/respond', this.respond.bind(this));
	}

	private async sendInvite(req: FastifyRequest, reply: FastifyReply) {
		try {
			const fromId = (req.user as any).id;
			const { toUserId, game } = req.body as { toUserId: number; game: string };
			const inv = await this.invService.sendInvite(fromId, toUserId, game);
			reply.status(201).send(inv);
		}
		catch (err) {
			reply.status(400).send({ message: (err as Error).message});
		}
	}

	private async listIncoming(req: FastifyRequest, reply: FastifyReply) {
		try {
			const toId = (req.user as any).id;
			const query = req.query as Record<string, string>;
			const paging: PagingDto = {
				limit: query.limit ? Number(query.limit) : undefined,
				lastId: query.lastId ? Number(query.lastId) : undefined,
				lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined
			}
			const invs = await this.invService.listIncoming(toId, paging);
			reply.send(invs);
		} catch (err) {
			reply.status(400).send({ message: (err as Error).message });
		}
	}

	private async listOutgoing(req: FastifyRequest, reply: FastifyReply) {
		try {
			const fromId = (req.user as any).id;
			const query = req.query as Record<string, string>;
			const paging: PagingDto = {
				limit: query.limit ? Number(query.limit) : undefined,
				lastId: query.lastId ? Number(query.lastId) : undefined,
				lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined
			}
			const invs = await this.invService.listOutgoing(fromId, paging);
			reply.send(invs);
		} catch (err) {
			reply.status(400).send({ message: (err as Error).message });
		}
	}

	private async respond(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (req.user as any).id;
			const inviteId = Number((req.params as any).id);
			const { accept } = req.body as { accept: boolean };
			const res = await this.invService.respondInvite(inviteId, userId, accept);
			reply.send(res);
		}
		catch (err) {
			reply.status(400).send({ message: (err as Error).message});
		}
	}
}