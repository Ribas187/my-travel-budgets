import type { User } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<Pick<User, 'name' | 'avatarUrl' | 'mainTravelId'>>): Promise<User>;
  isMemberOfTravel(userId: string, travelId: string): Promise<boolean>;
}
