import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Input } from 'tamagui';
import {
  AvatarChip,
  PrimaryButton,
  Body,
  SectionLabel,
  ErrorText,
} from '../../atoms';
import { DatePickerInput, DeleteConfirmDialog } from '../../molecules';
import { InviteMemberForm } from '../../organisms';
import {
  getMemberDisplayName,
  getMemberInitial,
  getAvatarColor,
} from '../../quarks';
import { createTravelSchema, SUPPORTED_CURRENCIES } from '@repo/core';
import type { TravelDetail } from '@repo/api-client';
import type { CreateTravelInput } from '@repo/api-client';

interface TripFormViewProps {
  travel?: TravelDetail;
  expenseCount?: number;
  saving: boolean;
  deleting?: boolean;
  onSave: (data: CreateTravelInput) => void;
  onDelete?: () => void;
  // Member management
  showInviteForm: boolean;
  inviteLoading: boolean;
  onShowInviteForm: () => void;
  onInviteByEmail: (email: string) => void;
  onAddGuest: (guestName: string) => void;
  onCancelInvite: () => void;
  onRemoveMember?: (memberId: string) => void;
}

const FormInput = styled(Input, {
  fontFamily: '$body',
  fontSize: 16,
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  color: '$textPrimary',
  minHeight: 48,
});

const Divider = styled(View, {
  height: 1,
  backgroundColor: '$borderDefault',
  marginVertical: '$lg',
});

const DeleteButton = styled(View, {
  borderWidth: 1,
  borderColor: '$statusDanger',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$2xl',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
});

const InviteLink = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$brandPrimary',
  cursor: 'pointer',
});

const CurrencySelect = styled(View, {
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  minHeight: 48,
  justifyContent: 'center',
  paddingHorizontal: '$lg',
  position: 'relative' as const,
});

function formatDateForInput(iso: string): string {
  return iso.includes('T') ? iso.split('T')[0]! : iso;
}

function getDefaultFormValues(travel?: TravelDetail): CreateTravelInput {
  if (travel) {
    return {
      name: travel.name,
      description: travel.description,
      currency: travel.currency,
      budget: travel.budget,
      startDate: formatDateForInput(travel.startDate),
      endDate: formatDateForInput(travel.endDate),
    };
  }
  return {
    name: '',
    description: null,
    currency: 'USD',
    budget: 0,
    startDate: '',
    endDate: '',
  };
}

export function TripFormView({
  travel,
  expenseCount = 0,
  saving,
  deleting = false,
  onSave,
  onDelete,
  showInviteForm,
  inviteLoading,
  onShowInviteForm,
  onInviteByEmail,
  onAddGuest,
  onCancelInvite,
  onRemoveMember,
}: TripFormViewProps) {
  const { t } = useTranslation();
  const isEditMode = !!travel;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateTravelInput>({
    resolver: zodResolver(createTravelSchema),
    defaultValues: getDefaultFormValues(travel),
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    (data: CreateTravelInput) => {
      onSave(data);
    },
    [onSave],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (onDelete) onDelete();
  }, [onDelete]);

  const isSaveDisabled = !isValid || saving;

  return (
    <YStack gap="$lg" testID="trip-form">
      {/* Trip Name */}
      <YStack gap="$sm">
        <SectionLabel>{t('travel.name')}</SectionLabel>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <FormInput
              testID="trip-name-input"
              value={value}
              onChangeText={onChange}
              placeholder={t('travel.namePlaceholder')}
              placeholderTextColor="$textTertiary"
              aria-label={t('travel.name')}
            />
          )}
        />
        {errors.name && (
          <ErrorText testID="trip-name-error">{errors.name.message}</ErrorText>
        )}
      </YStack>

      {/* Destination */}
      <YStack gap="$sm">
        <SectionLabel>
          <XStack gap="$xs" alignItems="center">
            <Text fontSize={14}>{'📍'}</Text>
            <Text
              fontFamily="$body"
              fontSize={13}
              fontWeight="600"
              color="$textTertiary"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              {t('travel.destination')}
            </Text>
          </XStack>
        </SectionLabel>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <FormInput
              testID="trip-destination-input"
              value={value ?? ''}
              onChangeText={(text: string) => onChange(text || null)}
              placeholder={t('travel.destinationPlaceholder')}
              placeholderTextColor="$textTertiary"
              aria-label={t('travel.destination')}
            />
          )}
        />
      </YStack>

      {/* Date Row */}
      <XStack gap="$md">
        <YStack gap="$sm" flex={1} minWidth={0}>
          <SectionLabel>{t('travel.startDate')}</SectionLabel>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, value } }) => (
              <DatePickerInput
                testID="trip-start-date-input"
                value={value}
                onChange={onChange}
                label={t('travel.startDate')}
                error={errors.startDate?.message}
              />
            )}
          />
        </YStack>
        <YStack gap="$sm" flex={1} minWidth={0}>
          <SectionLabel>{t('travel.endDate')}</SectionLabel>
          <Controller
            control={control}
            name="endDate"
            render={({ field: { onChange, value } }) => (
              <DatePickerInput
                testID="trip-end-date-input"
                value={value}
                onChange={onChange}
                label={t('travel.endDate')}
                error={errors.endDate?.message}
              />
            )}
          />
        </YStack>
      </XStack>

      {/* Currency + Budget Row */}
      <XStack gap="$md">
        <YStack gap="$sm" flex={1}>
          <SectionLabel>{t('travel.currency')}</SectionLabel>
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <CurrencySelect
                onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                testID="trip-currency-select"
                role="combobox"
                aria-expanded={showCurrencyDropdown}
              >
                <Text fontFamily="$body" fontSize={16} color="$textPrimary">
                  {value || t('travel.currency')}
                </Text>
                {showCurrencyDropdown && (
                  <YStack
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    backgroundColor="$white"
                    borderWidth={1}
                    borderColor="$borderDefault"
                    borderRadius="$lg"
                    zIndex={100}
                    maxHeight={200}
                    overflow="scroll"
                    marginTop="$xs"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <View
                        key={curr.code}
                        paddingVertical="$sm"
                        paddingHorizontal="$lg"
                        cursor="pointer"
                        backgroundColor={
                          value === curr.code ? '$parchment' : '$white'
                        }
                        hoverStyle={{ backgroundColor: '$parchment' }}
                        onPress={() => {
                          onChange(curr.code);
                          setShowCurrencyDropdown(false);
                        }}
                        testID={`currency-option-${curr.code}`}
                      >
                        <Text
                          fontFamily="$body"
                          fontSize={14}
                          color="$textPrimary"
                        >
                          {curr.code} ({curr.symbol})
                        </Text>
                      </View>
                    ))}
                  </YStack>
                )}
              </CurrencySelect>
            )}
          />
        </YStack>
        <YStack gap="$sm" flex={1}>
          <SectionLabel>{t('travel.totalBudget')}</SectionLabel>
          <Controller
            control={control}
            name="budget"
            render={({ field: { onChange, value } }) => (
              <FormInput
                testID="trip-budget-input"
                value={value ? String(value) : ''}
                onChangeText={(text: string) => {
                  const num = Number(text);
                  onChange(Number.isNaN(num) ? 0 : num);
                }}
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor="$textTertiary"
                aria-label={t('travel.totalBudget')}
              />
            )}
          />
          {errors.budget && (
            <ErrorText testID="trip-budget-error">
              {errors.budget.message}
            </ErrorText>
          )}
        </YStack>
      </XStack>

      {/* Travelers Section (edit mode) */}
      {isEditMode && travel && (
        <YStack gap="$md">
          <XStack justifyContent="space-between" alignItems="center">
            <SectionLabel>{t('travel.travelers')}</SectionLabel>
            {!showInviteForm && (
              <InviteLink
                onPress={onShowInviteForm}
                testID="invite-member-link"
              >
                + {t('member.invite')}
              </InviteLink>
            )}
          </XStack>

          {showInviteForm && (
            <InviteMemberForm
              loading={inviteLoading}
              onInviteByEmail={onInviteByEmail}
              onAddGuest={onAddGuest}
              onCancel={onCancelInvite}
            />
          )}

          <XStack flexWrap="wrap" gap="$md" testID="travelers-list">
            {(travel.members ?? []).map((member, index) => (
              <YStack
                key={member.id}
                padding="$sm"
                borderRadius="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
                backgroundColor="$white"
              >
                <AvatarChip
                  name={getMemberDisplayName(member)}
                  initial={getMemberInitial(member)}
                  avatarColor={getAvatarColor(index)}
                  avatarUrl={member.user?.avatarUrl}
                  role={
                    member.role === 'owner' ? t('member.admin') : undefined
                  }
                />
              </YStack>
            ))}
          </XStack>
        </YStack>
      )}

      {/* Save Button */}
      <View testID="save-trip-button">
        <PrimaryButton
          label={t('travel.saveChanges')}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaveDisabled}
          loading={saving}
        />
      </View>

      {/* Delete Trip (edit mode) */}
      {isEditMode && onDelete && (
        <>
          <Divider />
          <YStack gap="$sm" alignItems="center">
            <DeleteButton
              onPress={() => setShowDeleteDialog(true)}
              testID="delete-trip-button"
              role="button"
              aria-label={t('travel.deleteTrip')}
            >
              <Text fontFamily="$body" fontWeight="600" color="$statusDanger">
                {t('travel.deleteTrip')}
              </Text>
            </DeleteButton>
            <Body size="secondary" color="$textTertiary">
              {t('travel.deleteWarning')}
            </Body>
          </YStack>

          <DeleteConfirmDialog
            open={showDeleteDialog}
            title={t('travel.deleteConfirmTitle')}
            message={t('travel.deleteConfirmMessage', {
              name: travel?.name ?? '',
              count: expenseCount,
            })}
            warning={t('travel.deleteWarning')}
            loading={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteDialog(false)}
            testID="delete-trip"
          />
        </>
      )}
    </YStack>
  );
}
