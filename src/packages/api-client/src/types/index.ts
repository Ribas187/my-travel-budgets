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
} from '@repo/core'

export interface UserMe {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface Travel {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  currency: string
  budget: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface TravelMember {
  id: string
  travelId: string
  userId: string | null
  guestName: string | null
  role: 'owner' | 'member'
  user: UserMe | null
  createdAt: string
  updatedAt: string
}

export interface TravelDetail extends Travel {
  members: TravelMember[]
  categories: Category[]
}

export interface Category {
  id: string
  travelId: string
  name: string
  icon: string
  color: string
  budgetLimit: number | null
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  travelId: string
  categoryId: string
  memberId: string
  amount: number
  description: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseFilters {
  categoryId?: string
  memberId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export type BudgetAlertStatus = 'ok' | 'warning' | 'exceeded'

export interface OverallBudget {
  budget: number
  totalSpent: number
  status: BudgetAlertStatus
}

export interface MemberSpending {
  memberId: string
  displayName: string
  totalSpent: number
}

export interface CategorySpending {
  categoryId: string
  name: string
  icon: string
  color: string
  totalSpent: number
  budgetLimit: number | null
  status: BudgetAlertStatus
}

export interface DashboardData {
  currency: string
  overall: OverallBudget
  memberSpending: MemberSpending[]
  categorySpending: CategorySpending[]
}

export interface ApiError {
  statusCode: number
  message: string
  errors?: string[]
}
