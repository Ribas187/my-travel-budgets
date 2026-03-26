import type { Category } from '@prisma/client';

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  budgetLimit?: number | null;
}

export interface ICategoryRepository {
  findByTravelAndName(travelId: string, name: string): Promise<Category | null>;
  findByIdAndTravel(id: string, travelId: string): Promise<Category | null>;
  create(data: {
    travelId: string;
    name: string;
    icon: string;
    color: string;
    budgetLimit: number | null;
  }): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  countExpensesByCategory(categoryId: string): Promise<number>;
}
