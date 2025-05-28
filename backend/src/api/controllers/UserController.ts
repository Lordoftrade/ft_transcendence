import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../../services/UserService";
import fs from 'fs';
import path from 'path';
import { SystemUserService } from "../../services/SystemUserService";

interface StatusQuery {
  userId: string | string[];
}

export class UserController {
	private userService = new UserService();
	private systemUserService = new SystemUserService();

	constructor(private fastify: FastifyInstance){}

	public registerRoutes(): void {
		this.fastify.get('', this.getAll.bind(this));
		this.fastify.get('/profile', this.getProfile.bind(this));
		this.fastify.put('/profile', this.updateProfile.bind(this));
		this.fastify.post('/avatar', this.uploadAvatar.bind(this));
		this.fastify.post('/friend-request', this.sendFriendrequest.bind(this));
		this.fastify.post('/friend-accept', this.acceptFriendrequest.bind(this));
		this.fastify.get('/friends', this.getFriends.bind(this));
		this.fastify.get('/friend-requests', this.getIncomingRequests.bind(this));
		this.fastify.get('/:id', this.getUserById.bind(this));
		this.fastify.get('/statuses', this.getOnlineStatuses.bind(this));
		this.fastify.get('/:id/stats', this.getUserStats.bind(this));
		this.fastify.get('/system', this.getSystemUser.bind(this));
	}

	async getAll(req: FastifyRequest, reply: FastifyReply){
		try {
		const users = await this.userService.getAll();
		reply.send(users);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	async getProfile(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (req as any).user.id as number;
			UserService.markUserOnline(userId);
			const profile = await this.userService.getProfile(userId);
			if (!profile)
				return reply.status(404).send({ message: 'User not found' });
			reply.send(profile);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	async updateProfile(req: FastifyRequest, reply: FastifyReply) {

		try {
			const userId = (req as any).user.id as number;
			//get Json data
			const profileData = req.body as Partial<
			{ email: string; username: string; password: string }>;
			const updatedProfile = await this.userService.updateProfile(userId, profileData);
			reply.send(updatedProfile);
		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(400).send({ message: errorMsg });
		}
	}

	async uploadAvatar(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (req as any).user.id as number;
			const data = await req.file();

			if (!data) {
				return reply.status(400).send({ message: 'No file uploaded' });
			}

			//set file path
			const uploadDir = path.join(__dirname, '../../../uploads/avatars')
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}

			//form file name
			const fileName = `${userId}_${Date.now()}_${data.filename}`;
			const filePath = path.join(uploadDir, fileName);

			//create stream for file upload
			const writeStream = fs.createWriteStream(filePath);
			await data.file.pipe(writeStream);

			const updatedProfile = await this.userService
				.updateProfile(userId, { avatarUrl: `/uploads/avatars/${fileName}` });
			reply.send({ message: 'Avatar uploaded successfully', profile: updatedProfile });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	async sendFriendrequest(req: FastifyRequest, reply: FastifyReply) {
		try {
		const userId = (req as any).user.id as number;
		const { receiverId} = req.body as { receiverId: number};
		const result = await this.userService.sendFriendRequest(userId, receiverId);
		reply.send(result);
		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(400).send({ message: errorMsg });
		}
	}

	async acceptFriendrequest(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (req as any).user.id as number;
			const { requesterId } = req.body as { requesterId: number };
			const result = await this.userService.acceptFriendRequest(userId, requesterId);
			reply.send(result);
		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(400).send({ message: errorMsg });
		}
	}

	async getFriends(req: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (req as any).user.id as number;
			const friends = await this.userService.getFriends(userId);
			reply.send(friends);
		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	public async getIncomingRequests(
		req: FastifyRequest,
		reply: FastifyReply
	) {
		try {
		const userId = (req as any).user.id as number;
		const incoming = await this.userService.getIncomingRequests(userId);
		reply.send(incoming);

		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	private async getUserById(req: FastifyRequest, reply: FastifyReply) {
		try {
			const id = Number((req.params as any).id);
			if (isNaN(id)) {
				return reply.status(400).send({ message: "Invalid user ID" });
			}

			const profile = await this.userService.getProfile(id);
			if (!profile) {
				return reply.status(404).send({ message: "User not found" });
			}

			reply.send(profile);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	private async getSystemUser(req: FastifyRequest, reply: FastifyReply) {
		try {
			const systemUser = await this.systemUserService.ensureSystemUserExists();
			if (!systemUser) {
				return reply.status(404).send({ message: "System user not found" });
			}
			reply.send(systemUser);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}

	private async getOnlineStatuses(
		request: FastifyRequest<{ Querystring: StatusQuery }>,
		reply: FastifyReply
	) {
		try {
			// 1) Собираем массив чисел из query-параметров
			const raw = request.query.userId;
			const ids = (Array.isArray(raw) ? raw : [raw])
				.map(id => parseInt(id, 10))
				.filter(id => !isNaN(id));

			if (ids.length === 0) {
				return reply.status(400).send({ message: "Invalid user ID" });
			}

			// 2) Здесь мы вызываем ваш сервис
			const statuses = await this.userService.getOnlineStatuses(ids);

			// 3) Отдаем результат клиенту
			return reply.send(statuses);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}
	private async getUserStats(req: FastifyRequest, reply: FastifyReply) {	
		try {
			const userId = (req as any).user.id as number;
			const stats = await this.userService.getUserStats(userId);
			reply.send(stats);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(500).send({ message: errorMsg });
		}
	}
}