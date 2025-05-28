import { BlockRepository } from "../repositories/BlockRepository";

export class BlockService {
	constructor(
		private blockRepo = new BlockRepository()
	){}

	async blockUser(blockerId: number, blockedId: number) {
		if (blockerId === blockedId) {
			throw new Error("Can't block yourself!");
		}
		const already = await this.blockRepo.isBlocked(blockerId, blockedId);
		if (already) {
			throw new Error("User has been already blocked");
		}
		return this.blockRepo.blockUser(blockerId, blockedId);
	}

	async unblockUser(blockerId: number, blockedId: number) {
		const exists = await this.blockRepo.isBlocked(blockerId, blockedId);
		if (!exists) {
			throw new Error("User is not blocked");
		}
		return this.blockRepo.unblockUser(blockerId, blockedId);
	}

	async isBlockedBy(blockedId: number, blockerId: number): Promise<boolean> {
		return this.blockRepo.isBlocked(blockerId, blockedId);
	}

	async listBlocked(blockerId: number){
		 return this.blockRepo.listBlocked(blockerId);
	}
}