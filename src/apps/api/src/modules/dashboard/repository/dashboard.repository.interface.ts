export interface DashboardTravelMember {
  id: string;
  userId: string | null;
  guestName: string | null;
  user: { name: string | null } | null;
}

export interface DashboardTravelCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number | null;
}

export interface DashboardTravelData {
  id: string;
  currency: string;
  budget: number;
  members: DashboardTravelMember[];
  categories: DashboardTravelCategory[];
}

export interface MemberSpendingRow {
  memberId: string;
  totalSpent: number;
}

export interface CategorySpendingRow {
  categoryId: string;
  totalSpent: number;
}

export interface IDashboardRepository {
  getTravelWithMembersAndCategories(travelId: string): Promise<DashboardTravelData | null>;
  getSpendingByMember(travelId: string): Promise<MemberSpendingRow[]>;
  getSpendingByCategory(travelId: string): Promise<CategorySpendingRow[]>;
}
