import { PrismaClient, MatchMakingRequest } from "@prisma/client";

const prisma = new PrismaClient();

export class MatchMakingRequestRepository {
	async create(request: {userId: number, rating: number}): Promise<MatchMakingRequest> {
		return prisma.matchMakingRequest.create({
			data: {
				userId: request.userId, 
				rating: request.rating}
		});
	}

	async deleteByUser(userId: number): Promise<void>{
		await prisma.matchMakingRequest.delete({
			where: {userId: userId}
		});
	}

	async findAll(): Promise<MatchMakingRequest[]> {
		return prisma.matchMakingRequest.findMany({
			orderBy: {createdAt: 'asc'}
		});
	}

	async findByUser(userId: number): Promise<MatchMakingRequest | null> {
		return prisma.matchMakingRequest.findUnique({
			where: {userId: userId}
		});
	}
}