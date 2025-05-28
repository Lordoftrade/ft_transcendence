import { UserRepository } from "../repositories/UserRepository";
import { FriendshipRepository } from "../repositories/FriendshipRepository";
import { UserProfileDTO } from "../dtos/UserProfileDTO";
import { IncomingRequest } from "../dtos/IncomingRequestDto";
import bcrypt from 'bcryptjs'
import { FriendshipStatus, Prisma } from "@prisma/client";
import { getCallSites } from "util";

const onlineUsers = new Set<number>();

export class UserService {
	private userRepo = new UserRepository();
	private friendshipRepo = new FriendshipRepository();

	async getAll(){
		return this.userRepo.findAll();
	}

	async getProfile( userId: number){
		return this.userRepo.findById(userId);
	}

	async updateProfile(userId: number, profileData: UserProfileDTO) {
		const updateData: UserProfileDTO = { ...profileData };

		if (profileData.password) {
			updateData.password = await bcrypt.hash(profileData.password, 10);
		}

		if (updateData.email) {
			const existingByEmail = await this.userRepo.findByEmail(updateData.email);
			if (existingByEmail && existingByEmail.id !== userId) {
				throw new Error('Email already exists');
			}
		}

		// Проверяем уникальность username, если он передан
		if (updateData.username) {
			const existingByUsername = await this.userRepo.findByUsername(updateData.username);
			if (existingByUsername && existingByUsername.id !== userId) {
				throw new Error('Username already exists');
			}
		}

		return this.userRepo.updateUserProfile(userId, updateData);
	}

	async updateWins(userId: number) {
		try {
			const user = await this.userRepo.findById(userId);
			if (!user)
				throw new Error('User not found');

			const updData = {wins: user.wins + 1};
			this.userRepo.updateUserProfile(userId, updData);
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			console.error(`[UserService] updateWins: ${msg}`);
			throw new Error(msg);
		}
	}

	async updateLoses(userId: number) {
		try {
			const user = await this.userRepo.findById(userId);
			if (!user)
				throw new Error('User not found');

			const updData = {losses: user.losses + 1};
			this.userRepo.updateUserProfile(userId, updData);
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			console.error(`[UserService] updateWins: ${msg}`);
			throw new Error(msg);
		}
	}

	static markUserOnline(userId: number) {
		console.log(`[UserService] markUserOnline: ${userId}`);
		onlineUsers.add(userId);
	}

	static markUserOffline(userId: number) {
		console.log(`[UserService] markUserOnline: ${userId}`);
		onlineUsers.delete(userId);
	}

	static isUserOnline(userId: number): boolean {
		return onlineUsers.has(userId);
	}

	async sendFriendRequest(requesterId: number, receiverId: number) {
		if (requesterId === receiverId) {
			throw new Error("Can't add yourself to friends");
		}

		const existing = await this.friendshipRepo
			.findFriensdhip(requesterId, receiverId);
		
		if (existing)
			throw new Error("Friend request already exists or you are already friends");

		return await this.friendshipRepo.createFriendship(requesterId, receiverId);
	}

	async acceptFriendRequest(userId: number, requesterId: number) {
		const request = await this.friendshipRepo
			.findFriendshipRequest(userId, requesterId);
		
		if (!request)
			throw new Error("Friend request not found");

		return await this.friendshipRepo
			.updateFriendshipStatus(request.id, FriendshipStatus.ACCEPTED);
	}

	async getFriends(userId: number) {
		const friendships = await this.friendshipRepo.getAllFriends(userId);

		return friendships.map(f => {
			const friend = f.requesterId === userId ? f.receiver : f.requester;
			return {
				id: friend.id,
				username: friend.username,
				avatarUrl: friend.avatarUrl,
				isOnline: UserService.isUserOnline(friend.id)
			};
		});
	}

  async getIncomingRequests(userId: number): Promise<IncomingRequest[]> {
    const rows = await this.friendshipRepo.findIncomingRequests(userId);
    return rows.map(r => ({
      requester: {
        id:        r.requester.id,
        username:  r.requester.username,
        avatarUrl: r.requester.avatarUrl,
      }
    }));
  }

	public async getById(id: number) {
		return this.getProfile(id);
	}

	async getOnlineStatuses(ids: number[]): Promise<{ id: number; online: boolean }[]> {
  	return ids.map(id => ({
			id,
			online: UserService.isUserOnline(id),
			}));
	}
	async getUserStats(userId: number): Promise<{ wins: number; losses: number }> {	
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}
		return {
			wins: user.wins || 0,
			losses: user.losses || 0
		};
	}
}