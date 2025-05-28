import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BlockService } from "../../services/BlockService";

export class BlockController {
	constructor(
		private fastify: FastifyInstance,
		private blockService = new BlockService()
	) {}

	public registerSecureRoutes() {
		this.fastify.post('/:id', this.block.bind(this));
		this.fastify.delete('/:id', this.unblock.bind(this));
		this.fastify.get('', this.list.bind(this));
	}

	private async block(req: FastifyRequest, reply: FastifyReply) {
		try {
			const blockerId = (req.user as any).id;
			const blockedId = Number((req.params as any).id);
			const res = await this.blockService.blockUser(blockerId, blockedId);
			reply.status(201).send(res);
		}
		catch(err){
			reply.status(400).send({ message: (err as Error).message});
		}
	}

	private async unblock(req: FastifyRequest, reply: FastifyReply) {
		try {
			const blockerId = (req.user as any).id;
			const blockedId = Number((req.params as any).id);
			const res = await this.blockService.unblockUser(blockerId, blockedId);
			reply.status(201).send(res);
		}
		catch(err){
			reply.status(400).send({ message: (err as Error).message});
		}
	}

	private async list(req: FastifyRequest, reply: FastifyReply) {
		try {
			const blockerId = (req.user as any).id;
			const res = await this.blockService.listBlocked(blockerId);
			reply.send(res);
		}
		catch(err){
			reply.status(400).send({ message: (err as Error).message});
		}
	}
}