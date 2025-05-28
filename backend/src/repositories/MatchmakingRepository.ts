import { PrismaClient, Match, MatchStatus} from "@prisma/client";

export class MatchmakingRepository {
	constructor( private prisma = new PrismaClient()) {}

	async createMatchAndCleanup(player1Id: number, player2Id: number): Promise<Match> 
	{
		return this.prisma.$transaction(async (tx) => 
		{
			const exists = await tx.match.findFirst({
				where: {
					status: { in: [MatchStatus.PENDING, MatchStatus.ONGOING]},
					OR: [ 
						{player1Id: {in: [player1Id, player2Id]}},
						{player2Id: {in: [player1Id, player2Id]}}
					]
				}
			});
			if (exists) 
				throw new Error('Match for thees players already exists');	
			

			await tx.matchMakingRequest.deleteMany({
				where: { userId: { in: [player1Id, player2Id] } }
			});

			const match = await tx.match.create({
				data: { player1Id, player2Id }
			});
			return match;
		});
	}
}