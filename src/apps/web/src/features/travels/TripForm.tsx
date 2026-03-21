import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Input, Select } from 'tamagui';
import { AvatarChip, PrimaryButton, Heading, Body, Label, DatePickerInput } from '@repo/ui';
import { createTravelSchema } from '@repo/core';
import { SUPPORTED_CURRENCIES } from '@repo/core';
import type { TravelDetail, TravelMember } from '@repo/api-client';
import type { CreateTravelInput } from '@repo/api-client';

import { InviteMemberForm } from './InviteMemberForm';
import { DeleteTripDialog } from './DeleteTripDialog';

import { useAddMember } from '@/hooks/useAddMember';
import { useRemoveMember } from '@/hooks/useRemoveMember';
import { showToast } from '@/lib/toast';

interface TripFormProps {
  travel?: TravelDetail;
  expenseCount?: number;
  saving: boolean;
  deleting?: boolean;
  onSave: (data: CreateTravelInput) => void;
  onDelete?: () => void;
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

const ErrorText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  color: '$statusDanger',
});

const SectionLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textTertiary',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
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
  pressStyle: {
    opacity: 0.85,
  },
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

const AVATAR_COLORS = [
  '#C2410C',
  '#0D9488',
  '#7C3AED',
  '#2563EB',
  '#D97706',
  '#DC2626',
  '#059669',
  '#4F46E5',
  '#0284C7',
  '#9333EA',
];

function getMemberDisplayName(member: TravelMember): string {
  if (member.user?.name) return member.user.name;
  if (member.guestName) return member.guestName;
  return member.user?.email ?? 'Unknown';
}

function getMemberInitial(member: TravelMember): string {
  const name = getMemberDisplayName(member);
  return name.charAt(0).toUpperCase();
}

function formatDateForInput(iso: string): string {
  return iso.includes('T') ? iso.split('T')[0] : iso;
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

export function TripForm({
  travel,
  expenseCount = 0,
  saving,
  deleting = false,
  onSave,
  onDelete,
}: TripFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!travel;
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const addMember = useAddMember(travel?.id ?? '');
  const removeMember = useRemoveMember(travel?.id ?? '');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateTravelInput>({
    resolver: zodResolver(createTravelSchema),
    defaultValues: getDefaultFormValues(travel),
    mode: 'onChange',
  });

  const watchedCurrency = watch('currency');

  const onSubmit = useCallback(
    (data: CreateTravelInput) => {
      onSave(data);
    },
    [onSave],
  );

  const handleInviteByEmail = useCallback(
    (email: string) => {
      if (!addMember) return;
      addMember.mutate(
        { email },
        {
          onSuccess: () => {
            showToast(t('member.added'));
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleAddGuest = useCallback(
    (guestName: string) => {
      if (!addMember) return;
      addMember.mutate(
        { guestName },
        {
          onSuccess: () => {
            showToast(t('member.added'));
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      if (!removeMember) return;
      removeMember.mutate(memberId, {
        onSuccess: () => {
          showToast(t('member.removed'));
        },
      });
    },
    [removeMember, t],
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
        {errors.name && <ErrorText testID="trip-name-error">{errors.name.message}</ErrorText>}
      </YStack>

      {/* Destination (description) */}
      <YStack gap="$sm">
        <SectionLabel>
          <XStack gap="$xs" alignItems="center">
            <Text fontSize={14}>📍</Text>
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
        <YStack gap="$sm" flex={1}>
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
        <YStack gap="$sm" flex={1}>
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
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <View
                        key={currency.code}
                        paddingVertical="$sm"
                        paddingHorizontal="$lg"
                        cursor="pointer"
                        backgroundColor={value === currency.code ? '$parchment' : '$white'}
                        hoverStyle={{ backgroundColor: '$parchment' }}
                        onPress={() => {
                          onChange(currency.code);
                          setShowCurrencyDropdown(false);
                        }}
                        testID={`currency-option-${currency.code}`}
                      >
                        <Text fontFamily="$body" fontSize={14} color="$textPrimary">
                          {currency.code} ({currency.symbol})
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
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const num = parseFloat(cleaned);
                  onChange(isNaN(num) ? 0 : num);
                }}
                placeholder="0.00"
                placeholderTextColor="$textTertiary"
                keyboardType="decimal-pad"
                aria-label={t('travel.totalBudget')}
              />
            )}
          />
          {errors.budget && (
            <ErrorText testID="trip-budget-error">{errors.budget.message}</ErrorText>
          )}
        </YStack>
      </XStack>

      {/* Travelers Section (edit mode only) */}
      {isEditMode && travel && (
        <YStack gap="$md">
          <XStack justifyContent="space-between" alignItems="center">
            <SectionLabel>{t('travel.travelers')}</SectionLabel>
            {!showInviteForm && (
              <InviteLink onPress={() => setShowInviteForm(true)} testID="invite-member-link">
                + {t('member.invite')}
              </InviteLink>
            )}
          </XStack>

          {showInviteForm && (
            <InviteMemberForm
              loading={addMember?.isPending ?? false}
              onInviteByEmail={handleInviteByEmail}
              onAddGuest={handleAddGuest}
              onCancel={() => setShowInviteForm(false)}
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
                  avatarColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
                  role={member.role === 'owner' ? t('member.admin') : undefined}
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

      {/* Delete Trip (edit mode only) */}
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

          <DeleteTripDialog
            open={showDeleteDialog}
            tripName={travel?.name ?? ''}
            expenseCount={expenseCount}
            loading={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteDialog(false)}
          />
        </>
      )}
    </YStack>
  );
}
