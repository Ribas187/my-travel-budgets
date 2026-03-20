import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { styled, XStack, YStack, Text, View, Sheet, Input, useMedia } from 'tamagui'
import {
  AmountInput,
  CategoryChip,
  AvatarChip,
  BudgetImpactBanner,
  PrimaryButton,
  Body,
  Heading,
} from '@repo/ui'
import { createExpenseSchema } from '@repo/core'
import type { TravelDetail } from '@repo/api-client'
import { SUPPORTED_CURRENCIES } from '@repo/core'
import { useCreateExpense } from '@/hooks/useCreateExpense'
import { useBudgetImpact } from '@/hooks/useBudgetImpact'
import { showToast } from '@/lib/toast'

interface AddExpenseFormValues {
  categoryId: string
  memberId: string
  amount: number
  description: string
  date: string
}

interface AddExpenseModalProps {
  open: boolean
  onClose: () => void
  travel: TravelDetail
}

const Overlay = styled(View, {
  position: 'fixed' as any,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  zIndex: 9000,
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    bottomSheet: {
      true: {
        justifyContent: 'flex-end',
        alignItems: 'stretch',
      },
    },
  } as const,
})

const ModalCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$cardPadding',
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflow: 'scroll' as const,
  gap: '$lg',
})

const BottomSheetCard = styled(YStack, {
  backgroundColor: '$white',
  borderTopLeftRadius: '$2xl',
  borderTopRightRadius: '$2xl',
  padding: '$screenPaddingHorizontal',
  maxHeight: '90vh',
  overflow: 'scroll' as const,
  gap: '$lg',
  paddingBottom: '$3xl',
})

const SheetContent = styled(YStack, {
  padding: '$screenPaddingHorizontal',
  gap: '$lg',
  paddingBottom: '$3xl',
})

const DragHandle = styled(View, {
  width: 40,
  height: 5,
  borderRadius: 3,
  backgroundColor: '$sand',
  alignSelf: 'center',
  marginTop: '$sm',
})

const CloseButton = styled(Text, {
  fontSize: 24,
  color: '$textTertiary',
  cursor: 'pointer',
  padding: '$xs',
})

const SectionLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textTertiary',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
})

const DescriptionInput = styled(Input, {
  fontFamily: '$body',
  fontSize: 16,
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  color: '$textPrimary',
  minHeight: 48,
})

const AVATAR_COLORS = [
  '#C2410C', '#0D9488', '#7C3AED', '#2563EB', '#D97706',
  '#DC2626', '#059669', '#4F46E5', '#0284C7', '#9333EA',
]

function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)
  return currency?.symbol ?? currencyCode
}

function getMemberDisplayName(member: TravelDetail['members'][number]): string {
  if (member.user?.name) return member.user.name
  if (member.guestName) return member.guestName
  return member.user?.email ?? 'Unknown'
}

function getMemberInitial(member: TravelDetail['members'][number]): string {
  const name = getMemberDisplayName(member)
  return name.charAt(0).toUpperCase()
}

export function AddExpenseModal({ open, onClose, travel }: AddExpenseModalProps) {
  const { t } = useTranslation()
  const createExpense = useCreateExpense(travel.id)
  const [amountText, setAmountText] = useState('')

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      categoryId: '',
      memberId: travel.members[0]?.id ?? '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]!,
    },
    mode: 'onChange',
  })

  const watchedCategoryId = watch('categoryId')
  const watchedAmount = watch('amount')

  const budgetImpact = useBudgetImpact(travel.id, watchedCategoryId, watchedAmount)

  const handleAmountChange = useCallback(
    (text: string) => {
      // Allow only digits and one decimal point
      const cleaned = text.replace(/[^0-9.]/g, '')
      // Prevent multiple decimal points
      const parts = cleaned.split('.')
      const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
      setAmountText(sanitized)
      const numValue = parseFloat(sanitized)
      setValue('amount', isNaN(numValue) ? 0 : numValue, { shouldValidate: true })
    },
    [setValue],
  )

  const onSubmit = useCallback(
    (data: AddExpenseFormValues) => {
      createExpense.mutate(data, {
        onSuccess: () => {
          showToast(t('expense.saved'))
          reset()
          setAmountText('')
          onClose()
        },
      })
    },
    [createExpense, t, reset, onClose],
  )

  const handleClose = useCallback(() => {
    if (!createExpense.isPending) {
      reset()
      setAmountText('')
      onClose()
    }
  }, [createExpense.isPending, reset, onClose])

  const media = useMedia()
  const isMobile = !media.gtTablet

  if (!open) return null

  const currencySymbol = getCurrencySymbol(travel.currency)
  const isSaveDisabled = !isValid || watchedAmount <= 0 || createExpense.isPending

  const formContent = (
    <YStack gap="$lg" testID="add-expense-form">
      {/* Amount Input */}
      <YStack alignItems="center" gap="$sm" position="relative" cursor="text"
        onPress={() => {
          const el = document.querySelector<HTMLInputElement>('[data-testid="amount-input"]')
          el?.focus()
        }}
      >
        <AmountInput
          value={amountText || '0'}
          currencySymbol={currencySymbol}
          hint={t('expense.amount')}
        />
        <Input
          testID="amount-input"
          value={amountText}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          fontFamily="$body"
          fontSize={1}
          textAlign="center"
          borderWidth={0}
          backgroundColor="transparent"
          color="transparent"
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          opacity={0.01}
          zIndex={1}
          aria-label={t('expense.amount')}
        />
      </YStack>

      {/* Description */}
      <YStack gap="$sm">
        <SectionLabel id="desc-label">{t('expense.description')}</SectionLabel>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <DescriptionInput
              testID="description-input"
              value={value}
              onChangeText={onChange}
              placeholder={t('expense.descriptionPlaceholder')}
              placeholderTextColor="$textTertiary"
              aria-label={t('expense.description')}
            />
          )}
        />
      </YStack>

      {/* Category Selection */}
      <YStack gap="$sm">
        <SectionLabel id="category-label">{t('expense.category')}</SectionLabel>
        <XStack flexWrap="wrap" gap="$sm" testID="category-chips" role="radiogroup" aria-labelledby="category-label">
          {(travel.categories ?? []).map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              icon={<Text fontSize={16}>{category.icon}</Text>}
              selected={watchedCategoryId === category.id}
              selectedBackgroundColor={`${category.color}20`}
              selectedBorderColor={category.color}
              selectedTextColor={category.color}
              onPress={() =>
                setValue('categoryId', category.id, { shouldValidate: true })
              }
            />
          ))}
        </XStack>
      </YStack>

      {/* Paid By Selector */}
      <YStack gap="$sm">
        <SectionLabel id="paid-by-label">{t('expense.paidBy')}</SectionLabel>
        <Controller
          control={control}
          name="memberId"
          render={({ field: { value } }) => (
            <XStack flexWrap="wrap" gap="$md" testID="paid-by-chips" role="radiogroup" aria-labelledby="paid-by-label">
              {(travel.members ?? []).map((member, index) => {
                const isSelected = value === member.id
                return (
                  <YStack
                    key={member.id}
                    padding="$sm"
                    borderRadius="$lg"
                    borderWidth={isSelected ? 2 : 1}
                    borderColor={isSelected ? '$brandPrimary' : '$borderDefault'}
                    backgroundColor={isSelected ? '$parchment' : '$white'}
                    cursor="pointer"
                    onPress={() =>
                      setValue('memberId', member.id, { shouldValidate: true })
                    }
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={getMemberDisplayName(member)}
                  >
                    <AvatarChip
                      name={getMemberDisplayName(member)}
                      initial={getMemberInitial(member)}
                      avatarColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
                      role={member.role === 'owner' ? t('member.admin') : undefined}
                    />
                  </YStack>
                )
              })}
            </XStack>
          )}
        />
      </YStack>

      {/* Budget Impact Banner */}
      {budgetImpact.level !== 'none' && (
        <BudgetImpactBanner
          message={
            budgetImpact.level === 'danger'
              ? t('expense.budgetImpactDanger', { category: budgetImpact.categoryName })
              : t('expense.budgetImpactWarning', {
                  percentage: budgetImpact.percentageAfter,
                  category: budgetImpact.categoryName,
                })
          }
          percentageAfter={budgetImpact.percentageAfter}
        />
      )}

      {/* Save Button */}
      <View testID="save-expense-button">
        <PrimaryButton
          label={t('expense.saveExpense')}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaveDisabled}
          loading={createExpense.isPending}
        />
      </View>
    </YStack>
  )

  // Mobile: bottom sheet style
  if (isMobile) {
    return (
      <Overlay bottomSheet onPress={handleClose} testID="add-expense-overlay">
        <BottomSheetCard
          onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
          testID="add-expense-modal"
          role="dialog"
          aria-label={t('expense.add')}
        >
          <DragHandle />
          <XStack justifyContent="space-between" alignItems="center">
            <Heading level={3}>{t('expense.add')}</Heading>
            <CloseButton
              onPress={handleClose}
              role="button"
              aria-label={t('common.close')}
              testID="close-modal-button"
            >
              ✕
            </CloseButton>
          </XStack>
          {formContent}
        </BottomSheetCard>
      </Overlay>
    )
  }

  // Desktop: centered modal overlay
  return (
    <Overlay onPress={handleClose} testID="add-expense-overlay">
      <ModalCard
        onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        testID="add-expense-modal"
        role="dialog"
        aria-label={t('expense.add')}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Heading level={3}>{t('expense.add')}</Heading>
          <CloseButton
            onPress={handleClose}
            role="button"
            aria-label={t('common.close')}
            testID="close-modal-button"
          >
            ✕
          </CloseButton>
        </XStack>
        {formContent}
      </ModalCard>
    </Overlay>
  )
}
