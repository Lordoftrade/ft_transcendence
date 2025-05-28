import { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { FriendshipRepository } from '../repositories/FriendshipRepository';

const prisma = new PrismaClient();

export class SystemUserService {
  // Константы для системного пользователя
  public static readonly SYSTEM_USER_ID = 1; // Используем 1 вместо 0, так как SQLite обычно автоинкрементирует с 1
  private static readonly SYSTEM_USER_EMAIL = 'system@trance-and-dance.local';
  private static readonly SYSTEM_USER_USERNAME = 'System';
  
  private friendshipRepo = new FriendshipRepository();

  // Метод для создания или получения системного пользователя
  public async ensureSystemUserExists(): Promise<User> {
    try {
      // Сначала пытаемся найти системного пользователя
      let systemUser = await prisma.user.findUnique({
        where: { email: SystemUserService.SYSTEM_USER_EMAIL }
      });

      // Если системный пользователь не существует, создаем его
      if (!systemUser) {
        console.log('Creating system user...');
        systemUser = await prisma.user.create({
          data: {
            email: SystemUserService.SYSTEM_USER_EMAIL,
            username: SystemUserService.SYSTEM_USER_USERNAME,
            // Не устанавливаем пароль, так как он может быть null
            avatarUrl: '/img/default/system_avatar.jpg', // Специальный аватар для системы
          },
        });
        console.log('System user created with ID:', systemUser.id);
      }

      // Если ID системного пользователя не равен 1, обновляем ChatService
      if (systemUser.id !== SystemUserService.SYSTEM_USER_ID) {
        console.warn(`System user ID is ${systemUser.id}, expected ${SystemUserService.SYSTEM_USER_ID}. 
                     Chat messages will use the actual system user ID.`);
      }

      return systemUser;
    } catch (error) {
      console.error('Error ensuring system user exists:', error);
      throw error;
    }
  }

  // Метод для добавления системного пользователя в друзья к другому пользователю
  public async addSystemUserAsFriend(userId: number): Promise<void> {
    try {
      const systemUser = await this.ensureSystemUserExists();
      
      // Проверяем существующую дружбу
      const existingFriendship = await this.friendshipRepo.findFriensdhip(
        systemUser.id,
        userId
      );
      
      if (!existingFriendship) {
        // Создаем автоматически принятую заявку в друзья от системы пользователю
        await this.friendshipRepo.createAcceptedFriendship(systemUser.id, userId);
        console.log(`System user added as friend to user ${userId}`);
      }
    } catch (error) {
      console.error(`Error adding system user as friend to user ${userId}:`, error);
      // Не выбрасываем ошибку дальше, чтобы не блокировать регистрацию
    }
  }
}