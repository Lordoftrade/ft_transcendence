import { PagingDto } from "../dtos/PagingDto";
import { GameInvitationRepository } from "../repositories/GameInvitationRepository";
import { MatchRepository } from "../repositories/MatchRepository";
import { InviteStatus } from "@prisma/client";

export class InvitationService {
	constructor(
		private invRepo = new GameInvitationRepository(),
		private matchRepo = new MatchRepository()
	) {}

	async sendInvite(fromId: number, toId: number, game?: string, expiresAtMs = 5000 * 60) {
		if (fromId === toId) {
			throw new Error("Can't invite yourself");
		}
		const already = await this.invRepo.existsPending(fromId, toId, game);
		if (already)
			throw new Error("Invitation has been already sent");
		const expiresAt = new Date(Date.now() + expiresAtMs);
		return this.invRepo.createInvite(fromId, toId, expiresAt, game,);
	}

	async listIncoming(toId: number, paging: PagingDto) {
		return this.invRepo.findIncoming(toId, paging);
	}

	async listOutgoing(fromId: number, paging: PagingDto) {
		return this.invRepo.findOutgoing(fromId, paging);
	}

	async respondInvite(inviteId: number, userId: number, accept: boolean) {
		const inv = await this.invRepo.findById(inviteId);
		if (!inv || inv.toId !== userId) { 
			throw new Error ("Invitation not found"); 
		}
		if (inv.status !== InviteStatus.PENDING) {
			throw new Error("Invitation has beeen processed already");
		}
		if (inv.expiresAt.getTime() < Date.now()) {
			throw new Error("Invitation expired");
		}

		const newStatus = accept ? InviteStatus.ACCEPTED : InviteStatus.REJECTED;
		await this.invRepo.updateStatus(inviteId, newStatus);

		if (accept) {
			await this.matchRepo.createMatch(inv.fromId, inv.toId);
		}
		return { inviteId, status: newStatus};
	}
}