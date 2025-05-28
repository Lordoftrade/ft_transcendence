import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export class UserRepository{

	async findAll(){
		return prisma.user.findMany({
			// where: {online: true},
			select: {
				id: true,
				username: true,
				avatarUrl: true
			}
		});
	}

	async findByEmail(email: string){
		return prisma.user.findUnique({where: { email } });
	}

	async findByUsername(username: string){
		return prisma.user.findUnique({where: { username: username } });
	}

	async findById(id: number){
		return prisma.user.findUnique({ where: { id } });
	}

	async findByGoogleId(googleId: string){
		return prisma.user.findUnique({ where: { googleId }});
	}

	async existsByEmailOrUsername(email: string, username: string){
		return prisma.user.findFirst({
			where: { OR: [ {email}, { username}] }
		});
	}

	async createUser(email: string, username: string, password: string): Promise<User> {
		return prisma.user.create({
			data: { email, username, password }
		})
	}

	async createWithGoogle(data: {
		googleId: string, 
		email: string,
		username: string,
		avatarUrl?: string
	}) {
		return prisma.user.create({ data });
	}

	async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
		return prisma.user.update({
			where: {id},
			data
		});
	}
}