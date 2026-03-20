import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { styled, XStack, YStack, Text, ScrollView, Input, View } from 'tamagui'
import { ExpenseRow, DayGroupHeader, FilterChip, Heading, Body } from '@repo/ui'
import type { TravelDetail, Expense, Category, ExpenseFilters } from '@repo/api-client'
import { useTravelExpenses } from '@/hooks/useTravelExpenses'
import { groupExpensesByDay } from '@/utils/groupExpensesByDay'
import { AddExpenseModal } from './AddExpenseModal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDayLabel(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getMemberName(memberId: string, travel: TravelDetail): string {
  const member = (travel.members ?? []).find((m) => m.id === memberId)
  if (!member) return ''
  return member.user?.name ?? member.guestName ?? member.user?.email ?? ''
}

function getCategoryById(categoryId: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.id === categoryId)
}

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const FilterBar = styled(ScrollView, {
  flexDirection: 'row',
  marginBottom: '$md',
})

const FilterBarContent = styled(XStack, {
  gap: '$sm',
  paddingVertical: '$xs',
})

const SearchContainer = styled(XStack, {
  marginBottom: '$md',
  alignItems: 'center',
  backgroundColor: '$white',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderDefault',
  paddingHorizontal: '$md',
})

const SearchInput = styled(Input, {
  flex: 1,
  fontFamily: '$body',
  fontSize: 15,
  borderWidth: 0,
  backgroundColor: 'transparent',
  paddingVertical: '$sm',
})

const SearchToggle = styled(XStack, {
  cursor: 'pointer',
  padding: '$xs',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 44,
  minHeight: 44,
})

const Divider = styled(YStack, {
  height: 1,
  backgroundColor: '$borderDefault',
  marginVertical: '$xs',
})

const SkeletonBox = styled(YStack, {
  backgroundColor: '$sand',
  borderRadius: '$sm',
  overflow: 'hidden',
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExpenseRowSkeleton() {
  return (
    <XStack
      alignItems="center"
      gap="$iconTextGap"
      paddingVertical="$listItemPaddingVertical"
      paddingHorizontal="$listItemPaddingHorizontal"
      testID="expense-skeleton"
    >
      <SkeletonBox width={44} height={44} borderRadius="$xl" />
      <YStack flex={1} gap={4}>
        <SkeletonBox height={16} width="60%" />
        <SkeletonBox height={14} width="40%" />
      </YStack>
      <SkeletonBox height={18} width={60} />
    </XStack>
  )
}

function ExpenseListSkeleton() {
  return (
    <YStack testID="expense-list-skeleton">
      <XStack justifyContent="space-between" paddingVertical="$sm" paddingHorizontal="$listItemPaddingHorizontal">
        <SkeletonBox height={14} width={120} />
        <SkeletonBox height={14} width={60} />
      </XStack>
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <XStack justifyContent="space-between" paddingVertical="$sm" paddingHorizontal="$listItemPaddingHorizontal">
        <SkeletonBox height={14} width={100} />
        <SkeletonBox height={14} width={50} />
      </XStack>
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
    </YStack>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ExpenseListProps {
  travel: TravelDetail
}

export function ExpenseList({ travel }: ExpenseListProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  // Debounce search
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text)
    // Simple debounce using setTimeout
    const timeout = setTimeout(() => {
      setDebouncedSearch(text)
    }, 300)
    return () => clearTimeout(timeout)
  }, [])

  const filters: ExpenseFilters | undefined = selectedCategoryId
    ? { categoryId: selectedCategoryId }
    : undefined

  const { data: expensesRaw, isLoading } = useTravelExpenses(travel.id, filters)

  // Normalize: API may return Expense[] or { data: Expense[] }
  const expenses = useMemo(() => {
    if (!expensesRaw) return []
    if (Array.isArray(expensesRaw)) return expensesRaw
    if (Array.isArray((expensesRaw as any).data)) return (expensesRaw as any).data as Expense[]
    return []
  }, [expensesRaw])

  // Client-side search filtering (API doesn't support search param)
  const filteredExpenses = useMemo(() => {
    if (!expenses.length) return []
    if (!debouncedSearch.trim()) return expenses
    const query = debouncedSearch.toLowerCase()
    return expenses.filter((e) => e.description.toLowerCase().includes(query))
  }, [expenses, debouncedSearch])

  const dayGroups = useMemo(() => groupExpensesByDay(filteredExpenses), [filteredExpenses])

  const hasExpenses = expenses.length > 0
  const hasFilteredResults = filteredExpenses.length > 0
  const isFiltering = !!selectedCategoryId || !!debouncedSearch.trim()

  const selectedCategory = selectedCategoryId
    ? getCategoryById(selectedCategoryId, travel.categories ?? [])
    : undefined

  return (
    <YStack flex={1} testID="expense-list-container">
      {/* Header with search toggle */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$sm">
        <Heading level={3}>{t('nav.expenses')}</Heading>
        <SearchToggle
          onPress={() => {
            setSearchOpen((prev) => !prev)
            if (searchOpen) {
              setSearchText('')
              setDebouncedSearch('')
            }
          }}
          role="button"
          aria-label={t('common.search')}
          testID="search-toggle"
        >
          <Text fontSize={20}>🔍</Text>
        </SearchToggle>
      </XStack>

      {/* Search input */}
      {searchOpen && (
        <SearchContainer testID="search-container">
          <SearchInput
            placeholder={t('common.search')}
            value={searchText}
            onChangeText={handleSearchChange}
            testID="search-input"
            accessibilityLabel={t('common.search')}
          />
        </SearchContainer>
      )}

      {/* Filter chips */}
      <FilterBar horizontal showsHorizontalScrollIndicator={false} testID="filter-bar">
        <FilterBarContent>
          <FilterChip
            label={t('expense.allCategories')}
            active={!selectedCategoryId}
            onPress={() => setSelectedCategoryId(undefined)}
          />
          {(travel.categories ?? []).map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${cat.name}`}
              active={selectedCategoryId === cat.id}
              onPress={() =>
                setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)
              }
            />
          ))}
        </FilterBarContent>
      </FilterBar>

      {/* Content */}
      {isLoading ? (
        <ExpenseListSkeleton />
      ) : !hasExpenses && !isFiltering ? (
        /* Empty state — no expenses at all */
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$lg"
          padding="$2xl"
          testID="expense-empty-state"
        >
          <Text fontSize={48} role="img" aria-label="receipt">🧾</Text>
          <Body size="secondary">{t('expense.emptyState')}</Body>
        </YStack>
      ) : !hasFilteredResults && isFiltering ? (
        /* Filtered empty state */
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$lg"
          padding="$2xl"
          testID="expense-filtered-empty-state"
        >
          <Text fontSize={48} role="img" aria-label="search">🔍</Text>
          <Body size="secondary">
            {selectedCategory
              ? t('expense.emptyFilterState', { category: selectedCategory.name })
              : t('common.noResults')}
          </Body>
        </YStack>
      ) : (
        /* Expense list grouped by day */
        <ScrollView flex={1} testID="expense-day-list">
          {dayGroups.map((group, groupIndex) => (
            <YStack key={group.date}>
              {groupIndex > 0 && <Divider />}
              <DayGroupHeader
                label={formatDayLabel(group.date, locale)}
                total={formatAmount(group.dailyTotal, travel.currency, locale)}
              />
              {group.expenses.map((expense) => {
                const category = getCategoryById(expense.categoryId, travel.categories ?? [])
                return (
                  <View
                    key={expense.id}
                    cursor="pointer"
                    onPress={() => setSelectedExpense(expense)}
                    data-testid={`expense-row-pressable-${expense.id}`}
                  >
                    <ExpenseRow
                      title={expense.description}
                      category={category?.name ?? ''}
                      time={formatTime(expense.createdAt, locale)}
                      paidBy={getMemberName(expense.memberId, travel)}
                      amount={formatAmount(expense.amount, travel.currency, locale)}
                      icon={<Text fontSize={20}>{category?.icon ?? '📝'}</Text>}
                      iconBackgroundColor={category?.color ? `${category.color}20` : undefined}
                    />
                  </View>
                )
              })}
            </YStack>
          ))}
        </ScrollView>
      )}

      {/* Edit Expense Modal */}
      <AddExpenseModal
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        travel={travel}
        expense={selectedExpense}
      />
    </YStack>
  )
}
