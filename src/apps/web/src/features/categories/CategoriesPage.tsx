import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Spinner } from 'tamagui';
import { CategoryEditCard, PrimaryButton, Heading, Body, EmojiPicker, ColorPicker } from '@repo/ui';
import {
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_EMOJI,
  DEFAULT_CATEGORY_COLOR,
} from '@repo/core';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { DeleteCategoryDialog } from './DeleteCategoryDialog';

import { useCreateCategory } from '@/hooks/useCreateCategory';
import { useUpdateCategory } from '@/hooks/useUpdateCategory';
import { useDeleteCategory } from '@/hooks/useDeleteCategory';
import { useTravelExpenses } from '@/hooks/useTravelExpenses';
import { showToast } from '@/lib/toast';

const AddButton = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  color: '$brandPrimary',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.7,
  },
});

const PreviewCircle = styled(View, {
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
});

const FormField = styled(YStack, {
  gap: '$xs',
});

const FormLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textSecondary',
});

const FormInput = styled(View, {
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingHorizontal: '$md',
  paddingVertical: '$sm',
  backgroundColor: '$white',
});

const InputText = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  color: '$textPrimary',
});

const DestructiveLink = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$statusDanger',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.7,
  },
});

const EmptyContainer = styled(YStack, {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$2xl',
  gap: '$lg',
});

interface CategoryFormState {
  name: string;
  budgetLimit: string;
  selectedEmoji: string;
  selectedColor: string;
}

const DEFAULT_FORM: CategoryFormState = {
  name: '',
  budgetLimit: '',
  selectedEmoji: DEFAULT_CATEGORY_EMOJI,
  selectedColor: DEFAULT_CATEGORY_COLOR,
};

function getFormFromCategory(category: Category): CategoryFormState {
  return {
    name: category.name,
    budgetLimit: category.budgetLimit != null ? String(category.budgetLimit) : '',
    selectedEmoji: category.icon,
    selectedColor: category.color,
  };
}

interface CategoriesPageProps {
  travel: TravelDetail;
  isOwner: boolean;
}

export function CategoriesPage({ travel, isOwner }: CategoriesPageProps) {
  const { t } = useTranslation();
  const categories = travel.categories ?? [];
  const travelId = travel.id;

  const createCategory = useCreateCategory(travelId);
  const updateCategory = useUpdateCategory(travelId);
  const deleteCategory = useDeleteCategory(travelId);
  const { data: expenses } = useTravelExpenses(travelId);

  // Accordion state: expanded card ID or 'new' for a new card
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Form state for the currently expanded card
  const [form, setForm] = useState<CategoryFormState>(DEFAULT_FORM);
  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleToggle = useCallback(
    (id: string, category?: Category) => {
      if (expandedId === id) {
        setExpandedId(null);
      } else {
        setExpandedId(id);
        if (category) {
          setForm(getFormFromCategory(category));
        } else {
          setForm(DEFAULT_FORM);
        }
      }
    },
    [expandedId],
  );

  const handleCancel = useCallback(() => {
    setExpandedId(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setExpandedId('new');
    setForm(DEFAULT_FORM);
  }, []);

  const handleSave = useCallback(() => {
    const budgetLimit = form.budgetLimit ? Number(form.budgetLimit) : null;

    if (!form.name.trim()) return;

    if (expandedId === 'new') {
      const data: CreateCategoryInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit,
      };
      createCategory.mutate(data, {
        onSuccess: () => {
          showToast(t('category.created'));
          setExpandedId(null);
        },
      });
    } else if (expandedId) {
      const data: UpdateCategoryInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit,
      };
      updateCategory.mutate(
        { catId: expandedId, data },
        {
          onSuccess: () => {
            showToast(t('category.saved'));
            setExpandedId(null);
          },
        },
      );
    }
  }, [expandedId, form, createCategory, updateCategory, t]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast(t('category.deleted'));
        setDeleteTarget(null);
        setExpandedId(null);
      },
    });
  }, [deleteTarget, deleteCategory, t]);

  const getExpenseCountForCategory = useCallback(
    (categoryId: string) => {
      if (!expenses) return 0;
      return expenses.filter((e) => e.categoryId === categoryId).length;
    },
    [expenses],
  );

  const isSaving = createCategory.isPending || updateCategory.isPending;

  const emojiGroupLabels = useMemo(
    () =>
      Object.fromEntries(CATEGORY_EMOJIS.map((g) => [g.groupKey, t(g.groupKey)])),
    [t],
  );

  const renderForm = () => (
    <YStack gap="$md">
      <FormField>
        <FormLabel>{t('category.name')}</FormLabel>
        <FormInput>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('category.namePlaceholder')}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontFamily: 'Nunito, sans-serif',
              fontSize: 15,
              backgroundColor: 'transparent',
            }}
            data-testid="category-name-input"
            aria-label={t('category.name')}
          />
        </FormInput>
      </FormField>

      <FormField>
        <FormLabel>{t('category.budgetLimit')}</FormLabel>
        <FormInput>
          <input
            type="number"
            value={form.budgetLimit}
            onChange={(e) => setForm((f) => ({ ...f, budgetLimit: e.target.value }))}
            placeholder={t('category.budgetLimitPlaceholder')}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontFamily: 'Nunito, sans-serif',
              fontSize: 15,
              backgroundColor: 'transparent',
            }}
            data-testid="category-budget-input"
            aria-label={t('category.budgetLimit')}
          />
        </FormInput>
      </FormField>

      <XStack alignItems="center" gap="$md" marginVertical="$sm">
        <PreviewCircle
          backgroundColor={form.selectedColor + '22'}
          testID="category-live-preview"
        >
          <Text fontSize={28}>{form.selectedEmoji}</Text>
        </PreviewCircle>
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">
          {t('category.icon')} & {t('category.color')}
        </Text>
      </XStack>

      <FormField>
        <FormLabel>{t('category.icon')}</FormLabel>
        <EmojiPicker
          groups={CATEGORY_EMOJIS}
          selectedEmoji={form.selectedEmoji}
          onSelect={(emoji) => setForm((f) => ({ ...f, selectedEmoji: emoji }))}
          groupLabels={emojiGroupLabels}
          currentLabel={t('common.current')}
        />
      </FormField>

      <FormField>
        <FormLabel>{t('category.color')}</FormLabel>
        <ColorPicker
          colors={CATEGORY_COLORS}
          selectedColor={form.selectedColor}
          onSelect={(hex) => setForm((f) => ({ ...f, selectedColor: hex }))}
          currentLabel={t('common.current')}
        />
      </FormField>
    </YStack>
  );

  const renderActions = (categoryId?: string) => (
    <YStack gap="$md">
      <XStack gap="$md" justifyContent="flex-end">
        <View
          borderWidth={1}
          borderColor="$borderDefault"
          borderRadius="$lg"
          paddingVertical="$sm"
          paddingHorizontal="$lg"
          cursor="pointer"
          pressStyle={{ opacity: 0.85 }}
          onPress={handleCancel}
          role="button"
          aria-label={t('common.cancel')}
          testID="category-cancel-btn"
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {t('common.cancel')}
          </Text>
        </View>
        <View
          backgroundColor="$brandPrimary"
          borderRadius="$lg"
          paddingVertical="$sm"
          paddingHorizontal="$lg"
          cursor="pointer"
          pressStyle={{ opacity: 0.85 }}
          onPress={handleSave}
          opacity={isSaving ? 0.6 : 1}
          role="button"
          aria-label={t('common.save')}
          testID="category-save-btn"
        >
          <XStack alignItems="center" gap="$xs">
            {isSaving && <Spinner size="small" color="$white" />}
            <Text fontFamily="$body" fontWeight="600" color="$white">
              {t('common.save')}
            </Text>
          </XStack>
        </View>
      </XStack>
      {categoryId && (
        <DestructiveLink
          onPress={() => {
            const cat = categories.find((c) => c.id === categoryId);
            if (cat) setDeleteTarget(cat);
          }}
          testID="category-delete-link"
        >
          {t('common.delete')} {t('expense.category')}
        </DestructiveLink>
      )}
    </YStack>
  );

  // Empty state
  if (categories.length === 0 && expandedId !== 'new') {
    return (
      <YStack flex={1}>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
          <Heading level={2}>{t('category.manage')}</Heading>
          {isOwner && (
            <AddButton
              onPress={handleAddNew}
              role="button"
              aria-label={t('category.add')}
              testID="add-category-btn"
            >
              + {t('category.add')}
            </AddButton>
          )}
        </XStack>
        <EmptyContainer testID="categories-empty-state">
          <Text fontSize={48}>📂</Text>
          <Body size="primary" textAlign="center" color="$textTertiary">
            {t('category.emptyState')}
          </Body>
          {isOwner && (
            <PrimaryButton
              label={t('category.emptyStateCta')}
              onPress={handleAddNew}
              testID="empty-state-cta"
            />
          )}
        </EmptyContainer>
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{t('category.manage')}</Heading>
        {isOwner && (
          <AddButton
            onPress={handleAddNew}
            role="button"
            aria-label={t('category.add')}
            testID="add-category-btn"
          >
            + {t('category.add')}
          </AddButton>
        )}
      </XStack>

      <YStack gap="$md">
        {/* New category card */}
        {expandedId === 'new' && (
          <CategoryEditCard
            name={form.name || t('category.name')}
            expanded
            icon={<Text fontSize={22}>{form.selectedEmoji}</Text>}
            iconBackgroundColor={form.selectedColor + '22'}
            actions={renderActions()}
          >
            {renderForm()}
          </CategoryEditCard>
        )}

        {/* Existing categories */}
        {categories.map((category) => {
          const isExpanded = expandedId === category.id;
          const budgetLabel =
            category.budgetLimit != null
              ? `${t('category.budgetLimit')}: ${category.budgetLimit}`
              : undefined;

          return (
            <CategoryEditCard
              key={category.id}
              name={isExpanded ? form.name || category.name : category.name}
              budgetLabel={budgetLabel}
              expanded={isExpanded}
              onToggle={isOwner ? () => handleToggle(category.id, category) : undefined}
              icon={<Text fontSize={22}>{category.icon}</Text>}
              iconBackgroundColor={category.color + '22'}
              actions={isExpanded ? renderActions(category.id) : undefined}
            >
              {isExpanded ? renderForm() : undefined}
            </CategoryEditCard>
          );
        })}
      </YStack>

      <DeleteCategoryDialog
        open={!!deleteTarget}
        categoryName={deleteTarget?.name ?? ''}
        expenseCount={deleteTarget ? getExpenseCountForCategory(deleteTarget.id) : 0}
        loading={deleteCategory.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </YStack>
  );
}
