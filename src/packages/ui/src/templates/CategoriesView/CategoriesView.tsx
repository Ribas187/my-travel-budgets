import { useMemo, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Spinner, Input } from 'tamagui';
import { Heading, FormField, FormLabel } from '../../atoms';
import { EmojiPicker, ColorPicker, DeleteConfirmDialog, EmptyState } from '../../molecules';
import { CategoryEditCard } from '../../organisms';
import {
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
} from '@repo/core';
import type { Category } from '@repo/api-client';

interface CategoryFormState {
  name: string;
  budgetLimit: string;
  selectedEmoji: string;
  selectedColor: string;
}

interface CategoriesViewProps {
  categories: Category[];
  isOwner: boolean;
  expandedId: string | null;
  form: CategoryFormState;
  isSaving: boolean;
  deleteTarget: Category | null;
  deleteExpenseCount: number;
  isDeleting: boolean;
  onToggle: (id: string, category?: Category) => void;
  onAddNew: () => void;
  onCancel: () => void;
  onFormChange: (update: Partial<CategoryFormState>) => void;
  onSave: () => void;
  onDeleteRequest: (category: Category) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  budgetLimitRef?: RefObject<HTMLElement | null>;
}

export type { CategoriesViewProps };

export type { CategoryFormState };

const AddButton = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  color: '$brandPrimary',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

const PreviewCircle = styled(View, {
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
});

const FormInputContainer = styled(View, {
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingHorizontal: '$md',
  paddingVertical: '$sm',
  backgroundColor: '$white',
});

const DestructiveLink = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$statusDanger',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

export function CategoriesView({
  categories,
  isOwner,
  expandedId,
  form,
  isSaving,
  deleteTarget,
  deleteExpenseCount,
  isDeleting,
  onToggle,
  onAddNew,
  onCancel,
  onFormChange,
  onSave,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: CategoriesViewProps) {
  const { t } = useTranslation();

  const emojiGroupLabels = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_EMOJIS.map((g) => [g.groupKey, t(g.groupKey)]),
      ),
    [t],
  );

  const renderForm = () => (
    <YStack gap="$md">
      <FormField>
        <FormLabel>{t('category.name')}</FormLabel>
        <FormInputContainer>
          <Input
            value={form.name}
            onChangeText={(text) => onFormChange({ name: text })}
            placeholder={t('category.namePlaceholder')}
            placeholderTextColor="$textTertiary"
            fontFamily="$body"
            fontSize={15}
            borderWidth={0}
            backgroundColor="transparent"
            data-testid="category-name-input"
            aria-label={t('category.name')}
          />
        </FormInputContainer>
      </FormField>

      <FormField>
        <FormLabel>{t('category.budgetLimit')}</FormLabel>
        <FormInputContainer>
          <Input
            value={form.budgetLimit}
            onChangeText={(text) => onFormChange({ budgetLimit: text })}
            placeholder={t('category.budgetLimitPlaceholder')}
            placeholderTextColor="$textTertiary"
            inputMode="numeric"
            fontFamily="$body"
            fontSize={15}
            borderWidth={0}
            backgroundColor="transparent"
            data-testid="category-budget-input"
            aria-label={t('category.budgetLimit')}
          />
        </FormInputContainer>
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
          onSelect={(emoji) => onFormChange({ selectedEmoji: emoji })}
          groupLabels={emojiGroupLabels}
          currentLabel={t('common.current')}
        />
      </FormField>

      <FormField>
        <FormLabel>{t('category.color')}</FormLabel>
        <ColorPicker
          colors={CATEGORY_COLORS}
          selectedColor={form.selectedColor}
          onSelect={(hex) => onFormChange({ selectedColor: hex })}
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
          onPress={onCancel}
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
          onPress={onSave}
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
            if (cat) onDeleteRequest(cat);
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
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$2xl"
        >
          <Heading level={2}>{t('category.manage')}</Heading>
          {isOwner && (
            <AddButton
              onPress={onAddNew}
              role="button"
              aria-label={t('category.add')}
              testID="add-category-btn"
            >
              + {t('category.add')}
            </AddButton>
          )}
        </XStack>
        <EmptyState
          icon="📂"
          title={t('category.emptyState')}
          ctaLabel={isOwner ? t('category.emptyStateCta') : undefined}
          onCta={isOwner ? onAddNew : undefined}
          testID="categories-empty-state"
        />
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$2xl"
      >
        <Heading level={2}>{t('category.manage')}</Heading>
        {isOwner && (
          <AddButton
            onPress={onAddNew}
            role="button"
            aria-label={t('category.add')}
            testID="add-category-btn"
          >
            + {t('category.add')}
          </AddButton>
        )}
      </XStack>

      <YStack gap="$md">
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
              onToggle={
                isOwner ? () => onToggle(category.id, category) : undefined
              }
              icon={<Text fontSize={22}>{category.icon}</Text>}
              iconBackgroundColor={category.color + '22'}
              actions={isExpanded ? renderActions(category.id) : undefined}
            >
              {isExpanded ? renderForm() : undefined}
            </CategoryEditCard>
          );
        })}
      </YStack>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={t('category.deleteConfirmTitle')}
        message={t('category.deleteConfirmMessage', {
          count: deleteExpenseCount,
        })}
        warning={t('category.deleteWarning')}
        loading={isDeleting}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
        testID="delete-category"
      />
    </YStack>
  );
}
