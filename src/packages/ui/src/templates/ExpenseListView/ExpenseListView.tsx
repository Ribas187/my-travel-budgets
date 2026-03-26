import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, ScrollView, Input, View } from 'tamagui';
import { Heading, Body, SkeletonBox, FilterChip } from '../../atoms';
import { ExpenseRow, DayGroupHeader, EmptyState } from '../../molecules';
import { formatAmount, formatDayLabel, formatTime, getMemberDisplayName } from '../../quarks';
import { groupExpensesByDay } from '@repo/core';
import type { TravelDetail, Expense, Category } from '@repo/api-client';

interface ExpenseListViewProps {
  travel: TravelDetail;
  expenses: Expense[];
  isLoading: boolean;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
  onSelectExpense: (expense: Expense) => void;
  children?: ReactNode;
}

// Styled components
const FilterBar = styled(ScrollView, {
  flexDirection: 'row',
  marginBottom: '$sm',
  flexGrow: 0,
  flexShrink: 0,
});

const FilterBarContent = styled(XStack, {
  gap: '$sm',
  alignItems: 'center',
});

const SearchContainer = styled(XStack, {
  marginBottom: '$md',
  alignItems: 'center',
  backgroundColor: '$white',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderDefault',
  paddingHorizontal: '$md',
});

const SearchInput = styled(Input, {
  flex: 1,
  fontFamily: '$body',
  fontSize: 15,
  borderWidth: 0,
  backgroundColor: 'transparent',
  paddingVertical: '$sm',
  minHeight: 48,
});

const SearchToggle = styled(XStack, {
  cursor: 'pointer',
  padding: '$xs',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 44,
  minHeight: 44,
});

const Divider = styled(YStack, {
  height: 1,
  backgroundColor: '$borderDefault',
  marginVertical: '$xs',
});

// Skeleton
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
  );
}

function ExpenseListSkeleton() {
  return (
    <YStack testID="expense-list-skeleton">
      <XStack
        justifyContent="space-between"
        paddingVertical="$sm"
        paddingHorizontal="$listItemPaddingHorizontal"
      >
        <SkeletonBox height={14} width={120} />
        <SkeletonBox height={14} width={60} />
      </XStack>
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <XStack
        justifyContent="space-between"
        paddingVertical="$sm"
        paddingHorizontal="$listItemPaddingHorizontal"
      >
        <SkeletonBox height={14} width={100} />
        <SkeletonBox height={14} width={50} />
      </XStack>
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
    </YStack>
  );
}

function getCategoryById(
  categoryId: string,
  categories: Category[],
): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

function getMemberName(memberId: string, travel: TravelDetail): string {
  const member = (travel.members ?? []).find((m) => m.id === memberId);
  if (!member) return '';
  return getMemberDisplayName(member);
}

export function ExpenseListView({
  travel,
  expenses,
  isLoading,
  selectedCategoryId,
  onSelectCategory,
  onSelectExpense,
  children,
}: ExpenseListViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    const timeout = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Client-side search filtering
  const filteredExpenses = useMemo(() => {
    if (!expenses.length) return [];
    if (!debouncedSearch.trim()) return expenses;
    const query = debouncedSearch.toLowerCase();
    return expenses.filter((e) => e.description.toLowerCase().includes(query));
  }, [expenses, debouncedSearch]);

  const dayGroups = useMemo(
    () => groupExpensesByDay(filteredExpenses),
    [filteredExpenses],
  );

  const hasExpenses = expenses.length > 0;
  const hasFilteredResults = filteredExpenses.length > 0;
  const isFiltering = !!selectedCategoryId || !!debouncedSearch.trim();

  const selectedCategory = selectedCategoryId
    ? getCategoryById(selectedCategoryId, travel.categories ?? [])
    : undefined;

  return (
    <YStack flex={1} testID="expense-list-container">
      {/* Header with search toggle */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$sm"
      >
        <Heading level={3}>{t('nav.expenses')}</Heading>
        <SearchToggle
          onPress={() => {
            setSearchOpen((prev) => !prev);
            if (searchOpen) {
              setSearchText('');
              setDebouncedSearch('');
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
      <FilterBar
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="filter-bar"
      >
        <FilterBarContent>
          <FilterChip
            label={t('expense.allCategories')}
            active={!selectedCategoryId}
            onPress={() => onSelectCategory(undefined)}
          />
          {(travel.categories ?? []).map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${cat.name}`}
              active={selectedCategoryId === cat.id}
              onPress={() =>
                onSelectCategory(
                  selectedCategoryId === cat.id ? undefined : cat.id,
                )
              }
            />
          ))}
        </FilterBarContent>
      </FilterBar>

      {/* Content */}
      {isLoading ? (
        <ExpenseListSkeleton />
      ) : !hasExpenses && !isFiltering ? (
        <EmptyState
          icon="🧾"
          title={t('expense.emptyState')}
          testID="expense-empty-state"
        />
      ) : !hasFilteredResults && isFiltering ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$lg"
          padding="$2xl"
          testID="expense-filtered-empty-state"
        >
          <Text fontSize={48} role="img" aria-label="search">
            🔍
          </Text>
          <Body size="secondary">
            {selectedCategory
              ? t('expense.emptyFilterState', {
                  category: selectedCategory.name,
                })
              : t('common.noResults')}
          </Body>
        </YStack>
      ) : (
        <ScrollView flex={1} testID="expense-day-list">
          {dayGroups.map((group, groupIndex) => (
            <YStack key={group.date}>
              {groupIndex > 0 && <Divider />}
              <DayGroupHeader
                label={formatDayLabel(group.date, locale)}
                total={formatAmount(group.dailyTotal, travel.currency, locale)}
              />
              {group.expenses.map((expense) => {
                const category = getCategoryById(
                  expense.categoryId,
                  travel.categories ?? [],
                );
                return (
                  <View
                    key={expense.id}
                    cursor="pointer"
                    onPress={() => onSelectExpense(expense)}
                    data-testid={`expense-row-pressable-${expense.id}`}
                  >
                    <ExpenseRow
                      title={expense.description}
                      category={category?.name ?? ''}
                      time={formatTime(expense.createdAt, locale)}
                      paidBy={getMemberName(expense.memberId, travel)}
                      amount={formatAmount(
                        expense.amount,
                        travel.currency,
                        locale,
                      )}
                      icon={
                        <Text fontSize={20}>{category?.icon ?? '📝'}</Text>
                      }
                      iconBackgroundColor={
                        category?.color ? `${category.color}20` : undefined
                      }
                    />
                  </View>
                );
              })}
            </YStack>
          ))}
        </ScrollView>
      )}

      {children}
    </YStack>
  );
}
