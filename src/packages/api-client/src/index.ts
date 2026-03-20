export { ApiClient } from './client'
export type { ApiClientConfig } from './client'
export { queryKeys } from './queryKeys'
export type {
  UserMe,
  AuthSession,
  Travel,
  TravelDetail,
  TravelMember,
  Category,
  Expense,
  ExpenseFilters,
  DashboardData,
  OverallBudget,
  MemberSpending,
  CategorySpending,
  BudgetAlertStatus,
  ApiError,
} from './types'

// Re-export core input types for convenience
export type {
  CreateTravelInput,
  UpdateTravelInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  AddMemberInput,
  Currency,
  MemberRole,
} from './types'
