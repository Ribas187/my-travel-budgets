import type { TravelMember, User } from '@prisma/client';

export interface IMemberRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findByIdAndTravel(id: string, travelId: string): Promise<TravelMember | null>;
  createMember(data: {
    travelId: string;
    userId?: string;
    guestName?: string;
    role: string;
  }): Promise<TravelMember>;
  delete(id: string): Promise<void>;
}
