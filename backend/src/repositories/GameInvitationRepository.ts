import { PrismaClient, InviteStatus } from "@prisma/client";
import { PagingDto } from "../dtos/PagingDto";

const prisma = new PrismaClient();

export class GameInvitationRepository {

	async createInvite(fromId: number, toId: number, expiresAt: Date, game = "Pong") {
		return prisma.gameInvitation.create({
			data: { fromId, toId, game, expiresAt}
		});
	}

	async findIncoming(toId: number, paging: PagingDto) 
	{
		const { limit = 50, lastId} = paging;
		const now = new Date();

		return prisma.gameInvitation.findMany({
			where: { toId, status: InviteStatus.PENDING, expiresAt: { gt: now}},
			orderBy : {id: 'desc'},
			take: limit,
			...(lastId && { cursor: { id: lastId}, skip: 1})
				});
	}

	async findOutgoing(fromId: number, paging: PagingDto) 
	{
		const { limit = 50, lastId} = paging;

		return prisma.gameInvitation.findMany({
			where: { fromId, status: InviteStatus.PENDING},
			orderBy : {id: 'desc'},
			take: limit,
			...(lastId && { cursor: { id: lastId}, skip: 1})
		});
	}

	async updateStatus(id: number, status: InviteStatus) {
		return prisma.gameInvitation.update({
			where: { id },
			data: { status, respondedAt: new Date()}
		});
	}

	async existsPending(fromId: number, toId: number, game = "Pong"): 
		Promise<boolean> 
	{
		const count = await prisma.gameInvitation.count({
			where: { fromId, toId, game, status: InviteStatus.PENDING}
		});
		return count > 0;
	}

	async findById(id: number) {
		return prisma.gameInvitation.findUnique({ where: { id }});
	}
}