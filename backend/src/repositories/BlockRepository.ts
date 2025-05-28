import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class BlockRepository {

	async blockUser(blockerId: number, blockedId: number) {
		return prisma.block.create({
			data: {blockerId, blockedId}
		});
	}

	async unblockUser(blockerId: number, blockedId: number) {
		return prisma.block.delete({
			where: { blockerId_blockedId: { blockerId, blockedId}}
		});
	}

	async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
		const count = await prisma.block.count({
			where: {blockerId, blockedId}
		});
		return count > 0;
	}

	async listBlocked(blockerId: number) {
		return prisma.block.findMany({
			where: { blockerId}
		});
	}
}