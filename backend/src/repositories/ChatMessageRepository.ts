import { PrismaClient, MessageType}  from '@prisma/client'
import { PagingDto } from '../dtos/PagingDto';

export interface ConversationRow {
  otherId:     number;       // ID собеседника
  username:    string;       // его имя
  avatarUrl:   string | null;// ссылка на аватар
  lastMessage: string;       // текст последнего сообщения
  lastAt:      Date;         // время последнего сообщения
  unreadCount: number;       // сколько непрочитанных сообщений
}

const prisma = new PrismaClient();

export class ChatMessageRepository {

	async sendMessage(
		senderId: number, receiverId: number, content: string, type: MessageType) 
	{
		return prisma.chatMessage.create({
			data: {senderId, receiverId, content, type}
		});
	}

	async getConversation(userA: number, userB: number, paging: PagingDto) 
	{
		const { limit = 50, lastId, lastCreatedAt} = paging;
		return prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderId: userA, receiverId: userB},
					{ senderId: userB, receiverId: userA}
				]
			},
			orderBy: [
				{ createdAt: 'asc'},
				{ id: 'asc'}
			],
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        type: true,      // ← новенькое
        isRead: true
      },
			take: limit,
			...((lastId !== undefined && lastCreatedAt !== undefined) 
				? { cursor: {createdAt_id: {createdAt: lastCreatedAt, id: lastId}}, skip: 1} 
				: {})
		});
	}

	async markAsRead(messageIds: number[]){
		return prisma.chatMessage.updateMany({
			where: { id: { in: messageIds }}, 
			data: { isRead: true}
		})
	}

	async getUnread(receiverId: number, paging: PagingDto) 
	{
		const { limit = 50, lastId, lastCreatedAt} = paging;
		return prisma.chatMessage.findMany({
			where: { receiverId, isRead: false},
			orderBy: [
				{ createdAt: 'asc'},
				{ id: 'asc'}
			],
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        type: true,      // ← новенькое
        isRead: true
      },
			take: limit,
			...((lastId !== undefined && lastCreatedAt !== undefined) 
				? { cursor : {createdAt_id: {createdAt: lastCreatedAt, id: lastId}}, skip: 1}
				: {})
		});
	}

  public async listConversations(userId: number): Promise<ConversationRow[]> {
    // 1) Получаем списком пары [otherId, lastAt] — оба come as bigint
    const raws = await prisma.$queryRaw<{
      otherId: bigint;
      lastAt: bigint;
    }[]>`
      SELECT
        CASE WHEN "senderId" = ${userId} THEN "receiverId" ELSE "senderId" END  AS "otherId",
        MAX("createdAt") AS "lastAt"
      FROM "ChatMessage"
      WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
      GROUP BY "otherId"
    `;

    const result: ConversationRow[] = [];

    for (const { otherId, lastAt } of raws) {
      const otherIdNum = Number(otherId);
      const lastAtDate = new Date(Number(lastAt));

      // 2) Текст последнего сообщения (используем Date, а не bigint)
      const [msg] = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherIdNum },
            { senderId: otherIdNum, receiverId: userId }
          ],
          createdAt: lastAtDate
        },
        orderBy: { id: 'desc' },
        take: 1,
        select: { content: true }
      });

      // 3) Данные собеседника
      const user = await prisma.user.findUnique({
        where: { id: otherIdNum },
        select: { username: true, avatarUrl: true }
      });

      // 4) Считаем непрочитанные
      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderId: otherIdNum,
          receiverId: userId,
          isRead: false
        }
      });

      result.push({
        otherId:      otherIdNum,
        username:     user!.username,
        avatarUrl:    user!.avatarUrl,
        lastMessage:  msg.content,
        lastAt:       lastAtDate,
        unreadCount
      });
    }

    // Сортируем по дате
    return result.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  }
}