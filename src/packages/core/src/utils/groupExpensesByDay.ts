export interface Dateable {
  date: string;
  amount: number;
}

export interface DayGroup<T extends Dateable = Dateable> {
  date: string;
  dailyTotal: number;
  expenses: T[];
}

export function groupExpensesByDay<T extends Dateable>(expenses: T[]): DayGroup<T>[] {
  const groupMap = new Map<string, T[]>();

  for (const expense of expenses) {
    const date = expense.date.split('T')[0]!;
    const group = groupMap.get(date);
    if (group) {
      group.push(expense);
    } else {
      groupMap.set(date, [expense]);
    }
  }

  const groups: DayGroup<T>[] = Array.from(groupMap.entries()).map(([date, dayExpenses]) => ({
    date,
    dailyTotal: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
    expenses: dayExpenses,
  }));

  // Sort newest first
  groups.sort((a, b) => b.date.localeCompare(a.date));

  return groups;
}
