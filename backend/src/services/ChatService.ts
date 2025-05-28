import { PagingDto } from "../dtos/PagingDto";
import { ChatMessageRepository } from "../repositories/ChatMessageRepository";
import { BlockService } from "./BlockService";
import { MessageType } from "@prisma/client";
import { ConversationRow } from '../repositories/ChatMessageRepository';
import { SystemUserService } from './SystemUserService';

export class ChatService {
	constructor(
		private chatRepo = new ChatMessageRepository(),
		private blockService = new BlockService(),
		private systemUserService = new SystemUserService()
	){}

	async sendMessage(senderId: number, receiverId: number, content: string) {
		const isBlocked = await this.blockService.isBlockedBy(senderId, receiverId);
		if (isBlocked){
			throw new Error("Can't send message: you've been blocked");
		}
		return this.chatRepo.sendMessage(senderId, receiverId, content, MessageType.TEXT);
	}

	async getConversation(userA: number, userB: number, paging: PagingDto) 
	{
		const blockedAB = await this.blockService.isBlockedBy(userA, userB);
		const blockedBA = await this.blockService.isBlockedBy(userB, userA);
		if (blockedAB || blockedBA)
			return [];

		return this.chatRepo.getConversation(userA, userB, paging);
	}

	async fetchAndMarkRead(userId: number, senderId: number, paging: PagingDto) 
	{
		const isBlocked = await this.blockService.isBlockedBy(senderId, userId);
		if (isBlocked)
			throw new Error(
				"You blocked that user, so you can't see new messages from she/him");

		const unread = await this.chatRepo.getUnread(userId, paging);
		if (unread.length) {
			const ids = unread.map(m => m.id);
			await this.chatRepo.markAsRead(ids);
		}
		return unread;
	}

	async sendSystemMessage(receiverId: number, content: string, type: MessageType) {
		// Получаем актуального системного пользователя
		const systemUser = await this.systemUserService.ensureSystemUserExists();
		return this.chatRepo.sendMessage(systemUser.id, receiverId, content, type);
	}

  public async listConversations(userId: number): Promise<ConversationRow[]> {
    return this.chatRepo.listConversations(userId);
  }
}