import type { Travel } from '@prisma/client';

import type { CreateTravelDto } from '../dto/create-travel.dto';
import type { UpdateTravelDto } from '../dto/update-travel.dto';

export interface TravelWithDetails extends Travel {
  members: {
    id: string;
    userId: string;
    role: string;
    user: { id: string; email: string; name: string | null; avatarUrl: string | null };
  }[];
  categories: {
    id: string;
    travelId: string;
    name: string;
    icon: string;
    color: string;
    budgetLimit: unknown;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface ITravelRepository {
  createWithOwner(userId: string, data: CreateTravelDto): Promise<Travel>;
  findAllByUser(userId: string): Promise<Travel[]>;
  findOneWithDetails(travelId: string): Promise<TravelWithDetails | null>;
  getTotalSpent(travelId: string): Promise<number>;
  update(travelId: string, data: Partial<Pick<UpdateTravelDto, 'name' | 'description' | 'imageUrl' | 'budget'>> & { startDate?: Date; endDate?: Date }): Promise<Travel>;
  remove(travelId: string): Promise<void>;
}
