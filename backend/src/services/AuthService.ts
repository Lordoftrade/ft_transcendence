import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { OAuth2Client } from 'google-auth-library';
import { SystemUserService } from './SystemUserService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService{
	private userRepo = new UserRepository();
	private systemUserService = new SystemUserService();

	constructor() {}

	async register(email: string, username: string, password: string) {
		const existingUser = await this.userRepo.existsByEmailOrUsername(email, username);
		if (existingUser)
			throw new Error('Username or email already exists');

		if (!password)
			throw new Error('Password required!');

		const hash = await bcrypt.hash(password, 10);

		// Получаем пользователя после регистрации
		const user = await this.userRepo.createUser(
			email,
			username,
			hash,
		);

		// Добавляем системного пользователя в друзья
		await this.systemUserService.addSystemUserAsFriend(user.id);

		return user;
	}

	async validateUser(email: string, password: string) {
		const user = await this.userRepo.findByEmail(email);
		if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
			return null;
		return user;
	}

	async getUserById(id: number){
		return this.userRepo.findById(id);
	}

	async verifyGoogleTokenAndLogin(googleToken: string) {
		const ticket = await googleClient.verifyIdToken({
			idToken: googleToken,
			audience: process.env.GOOGLE_CLIENT_ID
		});

		const payload = ticket.getPayload();
		if (!payload || !payload.email || !payload.name)
			throw new Error("Invalid Google token");

		const { email, sub: googleId, name: username, picture: avatarUrl } = payload;

		let user = await this.userRepo.findByGoogleId(googleId);

		if (!user) {
			user = await this.userRepo.findByEmail(email);
			if (user){
				user = await this.userRepo.updateUserProfile(user.id, { googleId});
			}
			else {
				user = await this.userRepo.createWithGoogle({
					googleId,
					email,
					username,
					avatarUrl});
				await this.systemUserService.addSystemUserAsFriend(user.id);
			}
		}
		return user;
	}
}