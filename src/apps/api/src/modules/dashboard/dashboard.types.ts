export type BudgetAlertStatus = 'ok' | 'warning' | 'exceeded';

export interface OverallBudget {
  budget: number;
  totalSpent: number;
  status: BudgetAlertStatus;
}

export interface MemberSpendingItem {
  memberId: string;
  displayName: string;
  totalSpent: number;
}

export interface CategorySpendingItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  totalSpent: number;
  budgetLimit: number | null;
  status: BudgetAlertStatus;
}

export interface DashboardResponse {
  currency: string;
  overall: OverallBudget;
  memberSpending: MemberSpendingItem[];
  categorySpending: CategorySpendingItem[];
}

export function computeAlertStatus(spent: number, limit: number | null): BudgetAlertStatus {
  if (limit === null) return 'ok';
  if (spent >= limit) return 'exceeded';
  if (spent >= limit * 0.8) return 'warning';
  return 'ok';
}
