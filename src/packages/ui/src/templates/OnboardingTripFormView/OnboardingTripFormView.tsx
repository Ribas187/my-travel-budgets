import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View } from 'tamagui';
import { PrimaryButton, FormInput, SectionLabel } from '../../atoms';
import { OnboardingProgressBar } from '../../molecules/OnboardingProgressBar';

interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  currency: string;
  budget: string;
}

export interface OnboardingTripFormViewProps {
  title?: string;
  subtitle?: string;
  nextLabel?: string;
  skipLabel?: string;
  formData?: TripFormData;
  onFieldChange?: (field: keyof TripFormData, value: string) => void;
  onNext: ((data: { name: string; description: string; currency: string; budget: number; startDate: string; endDate: string }) => void) | (() => void);
  onBack?: () => void;
  onSkip: () => void;
  saving?: boolean;
}

const Title = styled(Text, {
  name: 'OnboardingTripFormTitle',
  fontFamily: '$heading',
  fontSize: 24,
  fontWeight: '700',
  color: '$textPrimary',
});

const HelperText = styled(Text, {
  name: 'HelperText',
  fontFamily: '$body',
  fontSize: 14,
  color: '$textSecondary',
  lineHeight: 20,
});

const SkipButton = styled(Text, {
  name: 'SkipButton',
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$textTertiary',
  textAlign: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

const NavButton = styled(View, {
  name: 'NavButton',
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$xl',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
});

const TOTAL_GROUPS = 3;

export function OnboardingTripFormView({
  title: titleProp,
  subtitle: subtitleProp,
  nextLabel: nextLabelProp,
  skipLabel: skipLabelProp,
  formData: externalFormData,
  onFieldChange: externalOnFieldChange,
  onNext,
  onBack,
  onSkip,
  saving = false,
}: OnboardingTripFormViewProps) {
  const { t } = useTranslation();
  const [fieldGroup, setFieldGroup] = useState(0);
  const [internalFormData, setInternalFormData] = useState<TripFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'USD',
    budget: '',
  });

  const formData = externalFormData ?? internalFormData;
  const onFieldChange: (field: keyof TripFormData, value: string) => void = externalOnFieldChange ?? ((field, value) => {
    setInternalFormData((prev) => ({ ...prev, [field]: value }));
  });

  const handleGroupBack = () => {
    if (fieldGroup === 0) {
      onBack?.();
    } else {
      setFieldGroup((prev) => prev - 1);
    }
  };

  const handleGroupNext = () => {
    if (fieldGroup === TOTAL_GROUPS - 1) {
      (onNext as (data: { name: string; description: string; currency: string; budget: number; startDate: string; endDate: string }) => void)({
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        budget: Number(formData.budget) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
    } else {
      setFieldGroup((prev) => prev + 1);
    }
  };

  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      testID="onboarding-trip-form-view"
    >
      <OnboardingProgressBar currentStep={2} totalSteps={4} />

      <Title testID="trip-form-title">
        {t('onboarding.createTrip.title')}
      </Title>

      {/* Field Group 0: Name + Description */}
      {fieldGroup === 0 && (
        <YStack gap="$lg" testID="field-group-name">
          <HelperText>{t('onboarding.createTrip.nameHelper')}</HelperText>
          <YStack gap="$sm">
            <SectionLabel>{t('travel.name')}</SectionLabel>
            <FormInput
              testID="trip-name-input"
              value={formData.name}
              onChangeText={(val: string) => onFieldChange('name', val)}
              placeholder={t('travel.namePlaceholder')}
              placeholderTextColor="$textTertiary"
              aria-label={t('travel.name')}
            />
          </YStack>
          <YStack gap="$sm">
            <SectionLabel>{t('travel.destination')}</SectionLabel>
            <FormInput
              testID="trip-description-input"
              value={formData.description}
              onChangeText={(val: string) => onFieldChange('description', val)}
              placeholder={t('travel.destinationPlaceholder')}
              placeholderTextColor="$textTertiary"
              aria-label={t('travel.destination')}
            />
          </YStack>
        </YStack>
      )}

      {/* Field Group 1: Dates */}
      {fieldGroup === 1 && (
        <YStack gap="$lg" testID="field-group-dates">
          <HelperText>{t('onboarding.createTrip.datesHelper')}</HelperText>
          <XStack gap="$md">
            <YStack gap="$sm" flex={1}>
              <SectionLabel>{t('travel.startDate')}</SectionLabel>
              <FormInput
                testID="trip-start-date-input"
                value={formData.startDate}
                onChangeText={(val: string) => onFieldChange('startDate', val)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="$textTertiary"
                aria-label={t('travel.startDate')}
              />
            </YStack>
            <YStack gap="$sm" flex={1}>
              <SectionLabel>{t('travel.endDate')}</SectionLabel>
              <FormInput
                testID="trip-end-date-input"
                value={formData.endDate}
                onChangeText={(val: string) => onFieldChange('endDate', val)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="$textTertiary"
                aria-label={t('travel.endDate')}
              />
            </YStack>
          </XStack>
        </YStack>
      )}

      {/* Field Group 2: Currency + Budget */}
      {fieldGroup === 2 && (
        <YStack gap="$lg" testID="field-group-budget">
          <HelperText>{t('onboarding.createTrip.budgetHelper')}</HelperText>
          <XStack gap="$md">
            <YStack gap="$sm" flex={1}>
              <SectionLabel>{t('travel.currency')}</SectionLabel>
              <FormInput
                testID="trip-currency-input"
                value={formData.currency}
                onChangeText={(val: string) => onFieldChange('currency', val)}
                placeholder="USD"
                placeholderTextColor="$textTertiary"
                aria-label={t('travel.currency')}
              />
            </YStack>
            <YStack gap="$sm" flex={1}>
              <SectionLabel>{t('travel.totalBudget')}</SectionLabel>
              <FormInput
                testID="trip-budget-input"
                value={formData.budget}
                onChangeText={(val: string) => onFieldChange('budget', val)}
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor="$textTertiary"
                aria-label={t('travel.totalBudget')}
              />
            </YStack>
          </XStack>
        </YStack>
      )}

      {/* Navigation */}
      <XStack justifyContent="space-between" alignItems="center">
        <NavButton
          onPress={handleGroupBack}
          testID="back-button"
          role="button"
          aria-label={t('common.back')}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {t('common.back')}
          </Text>
        </NavButton>
        <PrimaryButton
          label={
            fieldGroup === TOTAL_GROUPS - 1
              ? t('common.next')
              : t('common.next')
          }
          onPress={handleGroupNext}
          loading={saving && fieldGroup === TOTAL_GROUPS - 1}
          disabled={saving}
        />
      </XStack>

      <SkipButton
        testID="skip-button"
        onPress={onSkip}
        role="button"
        aria-label={t('onboarding.welcome.skip')}
      >
        {t('onboarding.welcome.skip')}
      </SkipButton>
    </YStack>
  );
}
