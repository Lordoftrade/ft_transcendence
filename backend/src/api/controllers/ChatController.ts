import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ChatService } from "../../services/ChatService";
import { PagingDto } from "../../dtos/PagingDto";

export class ChatController {
	constructor(
		private fastify: FastifyInstance,
		private chatService = new ChatService()
	) {}

	public registerSecureRoutes() {
		this.fastify.get('/', this.getConversations.bind(this));
		this.fastify.post('/:id/message', this.sendMessage.bind(this));
		this.fastify.get('/:id/conversation', this.getConversation.bind(this));
		this.fastify.get('/:id/unread', this.getUnread.bind(this));
	}

	private async sendMessage(req: FastifyRequest, reply: FastifyReply){
		try {
			const senderId = (req.user as any).id;
			const receiverId = Number((req.params as any).id);
			const { content } = req.body as { content: string };

			const msg = await this.chatService.sendMessage(senderId, receiverId, content);
			reply.status(201).send(msg);
		}
		catch (err) {
			reply.status(400).send({ message: (err as Error).message });
		}
	}

	private async getConversation(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userA = (req.user as any).id;
			const userB = Number((req.params as any).id);

			const query = req.query as Record<string, string>;
			const paging: PagingDto = {
				limit: query.limit ? Number(query.limit) : undefined,
				lastId: query.lastId ? Number(query.lastId) : undefined,
				lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined
			}
			const conv = await this.chatService.getConversation(userA, userB, paging);
			reply.send(conv);
		}
		catch (err){
			reply.status(400).send({ message: (err as Error).message});
		}
	}

	private async getUnread(req: FastifyRequest, reply: FastifyReply) {
		try {
			const receiverId = (req.user as any).id;
			const senderId = Number((req.params as any).id);

			const query = req.query as Record<string, string>;
			const paging: PagingDto = {
				limit: query.limit ? Number(query.limit) : undefined,
				lastId: query.lastId ? Number(query.lastId) : undefined,
				lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined
			}
			const unread = await this.chatService
				.fetchAndMarkRead(receiverId, senderId, paging);
			reply.send(unread);
		}
		catch (err) {
			reply.status(400).send({ message: (err as Error).message });
		}
	}

	private async getConversations(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req.user as any).id;
		console.log('GET /chat for user', userId);
		const list = await this.chatService.listConversations(userId);
		console.log('Conversations result:', list);
		reply.send(list);
	}
}