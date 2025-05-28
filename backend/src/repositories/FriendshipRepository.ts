import { FriendshipStatus, PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export class FriendshipRepository {
	async findFriensdhip(requesterId: number, receiverId: number) {
		return prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId, receiverId },
					{requesterId: receiverId, receiverId: requesterId}
				]
			}
		})
	}

	async findFriendshipRequest(userId: number, requesterId: number) {
		return await prisma.friendship.findFirst({
			where: {
				requesterId,
				receiverId: userId,
				status: FriendshipStatus.PENDING
			}
		});
	}

	async getAllFriends(userId: number){
		return prisma.friendship.findMany({
			where: {
				OR: [
					{requesterId: userId, status: FriendshipStatus.ACCEPTED},
					{receiverId: userId, status: FriendshipStatus.ACCEPTED}
				]
			},
			include: {
				requester: true,
				receiver: true
			}
		});
	}

	async updateFriendshipStatus(friendshipId: number, status: FriendshipStatus){
		return await prisma.friendship.update({
			where: {id: friendshipId},
			data: { status: status}
		});
	}

	async createFriendship(requesterId: number, receiverId: number) {
		return prisma.friendship.create({
			data: { requesterId, receiverId, status: FriendshipStatus.PENDING}
		});
	}

  async findIncomingRequests(userId: number) {
    return prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status:     FriendshipStatus.PENDING
      },
      include: { requester: true }
    });
  }

	/**
	 * Создает дружбу с автоматическим подтверждением
	 */
	async createAcceptedFriendship(requesterId: number, receiverId: number) {
		return prisma.friendship.create({
			data: {
				requesterId,
				receiverId,
				status: FriendshipStatus.ACCEPTED
			}
		});
	}
}