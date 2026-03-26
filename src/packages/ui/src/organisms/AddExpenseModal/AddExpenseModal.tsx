import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Input, useMedia } from 'tamagui';
import { CategoryChip, AvatarChip, PrimaryButton, Body, Heading, SectionLabel } from '../../atoms';
import { BudgetImpactBanner, DatePickerInput, AmountInput, DeleteConfirmDialog } from '../../molecules';
import { useCalculatorInput } from '../../hooks/useCalculatorInput';
import { getCurrencySymbol, getMemberDisplayName, getMemberInitial, formatAmount, getAvatarColor } from '../../quarks';
import { createExpenseSchema } from '@repo/core';
import type { TravelDetail, Expense } from '@repo/api-client';

interface AddExpenseFormValues {
  categoryId: string;
  memberId: string;
  amount: number;
  description: string;
  date: string;
}

interface BudgetImpactData {
  level: string;
  categoryName: string;
  percentageAfter: number;
}

interface AddExpenseModalProps {
  open: boolean;
  travel: TravelDetail;
  expense?: Expense | null;
  budgetImpact: BudgetImpactData;
  saving: boolean;
  deleting: boolean;
  onSave: (data: AddExpenseFormValues) => void;
  onDelete: (expenseId: string) => void;
  onClose: () => void;
  onNavigateToCategories: () => void;
  onCategoryChange?: (categoryId: string) => void;
  onAmountChange?: (amount: number) => void;
}

export type { AddExpenseFormValues };

const Overlay = styled(View, {
  position: 'fixed' as any,
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  zIndex: 9000,
  justifyContent: 'center',
  alignItems: 'center',
  variants: {
    bottomSheet: {
      true: { justifyContent: 'flex-end', alignItems: 'stretch' },
    },
  } as const,
});

const ModalCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$cardPadding',
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflow: 'scroll' as const,
  gap: '$lg',
});

const BottomSheetCard = styled(YStack, {
  backgroundColor: '$white',
  borderTopLeftRadius: '$2xl',
  borderTopRightRadius: '$2xl',
  padding: '$screenPaddingHorizontal',
  maxHeight: '90vh',
  overflow: 'scroll' as const,
  gap: '$lg',
  paddingBottom: '$3xl',
});

const DragHandle = styled(View, {
  width: 40, height: 5, borderRadius: 3, backgroundColor: '$sand', alignSelf: 'center', marginTop: '$sm',
});

const CloseButton = styled(Text, {
  fontSize: 24, color: '$textTertiary', cursor: 'pointer', padding: '$xs',
});

const DescriptionInput = styled(Input, {
  fontFamily: '$body', fontSize: 16, borderWidth: 1, borderColor: '$borderDefault', borderRadius: '$lg',
  paddingVertical: '$md', paddingHorizontal: '$lg', color: '$textPrimary', minHeight: 48,
});

export function AddExpenseModal({
  open, travel, expense, budgetImpact, saving, deleting,
  onSave, onDelete, onClose, onNavigateToCategories, onCategoryChange, onAmountChange,
}: AddExpenseModalProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isEditMode = !!expense;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const amountInputRef = useRef<any>(null);
  const calculatorInput = useCalculatorInput({ initialValue: expense?.amount ?? 0 });

  const { control, handleSubmit, watch, setValue, reset, formState: { isValid } } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      categoryId: expense?.categoryId ?? '',
      memberId: expense?.memberId ?? travel.members[0]?.id ?? '',
      amount: expense?.amount ?? 0,
      description: expense?.description ?? '',
      date: expense?.date ?? new Date().toISOString().split('T')[0]!,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (expense) {
      reset({
        categoryId: expense.categoryId, memberId: expense.memberId,
        amount: expense.amount, description: expense.description, date: expense.date,
      });
      calculatorInput.reset(expense.amount);
    } else {
      reset({
        categoryId: '', memberId: travel.members[0]?.id ?? '',
        amount: 0, description: '', date: new Date().toISOString().split('T')[0]!,
      });
      calculatorInput.reset(0);
    }
    setShowDeleteDialog(false);
  }, [expense, reset, travel.members]);

  useEffect(() => {
    setValue('amount', calculatorInput.numericValue, { shouldValidate: true });
    onAmountChange?.(calculatorInput.numericValue);
  }, [calculatorInput.numericValue, setValue, onAmountChange]);

  const watchedCategoryId = watch('categoryId');
  const watchedAmount = watch('amount');

  useEffect(() => {
    if (watchedCategoryId) onCategoryChange?.(watchedCategoryId);
  }, [watchedCategoryId, onCategoryChange]);

  const onSubmit = useCallback((data: AddExpenseFormValues) => {
    onSave(data);
    reset();
    calculatorInput.reset(0);
  }, [onSave, reset, calculatorInput]);

  const handleDelete = useCallback(() => {
    if (!expense) return;
    onDelete(expense.id);
    setShowDeleteDialog(false);
    reset();
    calculatorInput.reset(0);
  }, [expense, onDelete, reset, calculatorInput]);

  const isPending = saving;
  const handleClose = useCallback(() => {
    if (!isPending) {
      reset(); calculatorInput.reset(0); setShowDeleteDialog(false); onClose();
    }
  }, [isPending, reset, onClose, calculatorInput]);

  const media = useMedia();
  const isMobile = !media.gtTablet;

  if (!open) return null;

  const currencySymbol = getCurrencySymbol(travel.currency);
  const isSaveDisabled = !isValid || watchedAmount <= 0 || isPending;
  const modalTitle = isEditMode ? t('expense.edit') : t('expense.add');
  const hasNoCategories = (travel.categories ?? []).length === 0;

  const noCategoriesContent = (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$screenPaddingHorizontal" gap="$lg" data-testid="no-categories-guard">
      <Text fontSize={64}>📁</Text>
      <Heading level={3} textAlign="center">{t('expense.noCategoriesTitle')}</Heading>
      <Body size="secondary" textAlign="center" color="$textTertiary">{t('expense.noCategoriesMessage')}</Body>
      <PrimaryButton label={t('expense.noCategoriesCta')} onPress={() => { onClose(); onNavigateToCategories(); }} />
    </YStack>
  );

  const formContent = (
    <YStack gap="$lg" testID="add-expense-form">
      {/* Amount */}
      <YStack alignItems="center" gap="$sm" position="relative" cursor="text" onPress={() => { amountInputRef.current?.focus(); }}>
        <AmountInput value={calculatorInput.displayText} currencySymbol={currencySymbol} hint={t('expense.amount')} />
        <Input ref={amountInputRef} testID="amount-input" value={calculatorInput.rawDigits} onChangeText={calculatorInput.handleChange} inputMode="numeric" placeholder="0"
          fontFamily="$body" fontSize={1} textAlign="center" borderWidth={0} backgroundColor="transparent" color="transparent"
          position="absolute" top={0} left={0} width="100%" height="100%" opacity={0.01} zIndex={1} tabIndex={0} aria-label={t('expense.amount')} />
      </YStack>

      {/* Description */}
      <YStack gap="$sm">
        <SectionLabel>{t('expense.description')}</SectionLabel>
        <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
          <DescriptionInput testID="description-input" value={value} onChangeText={onChange} placeholder={t('expense.descriptionPlaceholder')} placeholderTextColor="$textTertiary" aria-label={t('expense.description')} />
        )} />
      </YStack>

      {/* Date */}
      <YStack gap="$sm">
        <SectionLabel>{t('expense.date')}</SectionLabel>
        <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
          <DatePickerInput testID="expense-date-input" value={value} onChange={onChange} label={t('expense.date')} />
        )} />
      </YStack>

      {/* Category Selection */}
      <YStack gap="$sm">
        <SectionLabel id="category-label">{t('expense.category')}</SectionLabel>
        <XStack flexWrap="wrap" gap="$sm" testID="category-chips" role="radiogroup" aria-labelledby="category-label">
          {(travel.categories ?? []).map((category) => (
            <CategoryChip key={category.id} label={category.name} icon={<Text fontSize={16}>{category.icon}</Text>}
              selected={watchedCategoryId === category.id}
              selectedBackgroundColor={`${category.color}20`} selectedBorderColor={category.color} selectedTextColor={category.color}
              onPress={() => setValue('categoryId', category.id, { shouldValidate: true })} />
          ))}
        </XStack>
      </YStack>

      {/* Paid By */}
      <YStack gap="$sm">
        <SectionLabel id="paid-by-label">{t('expense.paidBy')}</SectionLabel>
        <Controller control={control} name="memberId" render={({ field: { value } }) => (
          <XStack flexWrap="wrap" gap="$md" testID="paid-by-chips" role="radiogroup" aria-labelledby="paid-by-label">
            {(travel.members ?? []).map((member, index) => {
              const isSelected = value === member.id;
              return (
                <YStack key={member.id} padding="$sm" borderRadius="$lg" borderWidth={isSelected ? 2 : 1}
                  borderColor={isSelected ? '$brandPrimary' : '$borderDefault'}
                  backgroundColor={isSelected ? '$parchment' : '$white'} cursor="pointer"
                  onPress={() => setValue('memberId', member.id, { shouldValidate: true })}
                  role="radio" aria-checked={isSelected} aria-label={getMemberDisplayName(member, t('common.unknown'))}>
                  <AvatarChip name={getMemberDisplayName(member, t('common.unknown'))} initial={getMemberInitial(member)}
                    avatarColor={getAvatarColor(index)} avatarUrl={member.user?.avatarUrl}
                    role={member.role === 'owner' ? t('member.admin') : undefined} />
                </YStack>
              );
            })}
          </XStack>
        )} />
      </YStack>

      {/* Budget Impact */}
      {budgetImpact.level !== 'none' && (
        <BudgetImpactBanner
          message={budgetImpact.level === 'danger'
            ? t('expense.budgetImpactDanger', { category: budgetImpact.categoryName })
            : t('expense.budgetImpactWarning', { percentage: budgetImpact.percentageAfter, category: budgetImpact.categoryName })}
          percentageAfter={budgetImpact.percentageAfter} />
      )}

      {/* Save */}
      <View testID="save-expense-button">
        <PrimaryButton label={t('expense.saveExpense')} onPress={handleSubmit(onSubmit)} disabled={isSaveDisabled} loading={isPending} />
      </View>

      {/* Delete (edit mode) */}
      {isEditMode && (
        <XStack justifyContent="center" paddingVertical="$sm" cursor="pointer" onPress={() => setShowDeleteDialog(true)} testID="delete-expense-button">
          <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$coral500">{t('common.delete')}</Text>
        </XStack>
      )}
    </YStack>
  );

  const modalContent = (
    <>
      <XStack justifyContent="space-between" alignItems="center">
        <Heading level={3}>{modalTitle}</Heading>
        <CloseButton onPress={handleClose} role="button" aria-label={t('common.close')} testID="close-modal-button">✕</CloseButton>
      </XStack>
      {hasNoCategories ? noCategoriesContent : formContent}
    </>
  );

  const deleteDialog = showDeleteDialog && expense && (
    <DeleteConfirmDialog
      open={showDeleteDialog}
      title={t('common.delete')}
      message={t('expense.deleteConfirm', { description: expense.description, amount: formatAmount(expense.amount, travel.currency, locale) })}
      loading={deleting}
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteDialog(false)}
      testID="delete-expense"
    />
  );

  if (isMobile) {
    return (
      <Overlay bottomSheet onPress={handleClose} testID="add-expense-overlay">
        <BottomSheetCard onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()} testID="add-expense-modal" role="dialog" aria-label={modalTitle}>
          <DragHandle />
          {modalContent}
        </BottomSheetCard>
        {deleteDialog}
      </Overlay>
    );
  }

  return (
    <Overlay onPress={handleClose} testID="add-expense-overlay">
      <ModalCard onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()} testID="add-expense-modal" role="dialog" aria-label={modalTitle}>
        {modalContent}
      </ModalCard>
      {deleteDialog}
    </Overlay>
  );
}
