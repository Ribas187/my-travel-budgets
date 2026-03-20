import type { Expense } from '@repo/api-client';

export interface DayGroup {
  date: string;
  dailyTotal: number;
  expenses: Expense[];
}

export function groupExpensesByDay(expenses: Expense[]): DayGroup[] {
  const groupMap = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const date = expense.date.split('T')[0]!;
    const group = groupMap.get(date);
    if (group) {
      group.push(expense);
    } else {
      groupMap.set(date, [expense]);
    }
  }

  const groups: DayGroup[] = Array.from(groupMap.entries()).map(([date, dayExpenses]) => ({
    date,
    dailyTotal: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
    expenses: dayExpenses,
  }));

  // Sort newest first
  groups.sort((a, b) => b.date.localeCompare(a.date));

  return groups;
}
