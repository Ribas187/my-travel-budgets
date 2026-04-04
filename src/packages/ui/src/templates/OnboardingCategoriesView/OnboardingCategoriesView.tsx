import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View } from 'tamagui';
import { PrimaryButton } from '../../atoms';
import { OnboardingProgressBar } from '../../molecules/OnboardingProgressBar';
import type { DefaultCategory } from '@repo/core';

interface CategoryItem extends DefaultCategory {
  selected: boolean;
}

interface OnboardingCategoriesViewProps {
  categories: CategoryItem[];
  onToggleCategory: (index: number) => void;
  onEditCategory: (index: number) => void;
  onAddCustom: () => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  saving?: boolean;
}

const Title = styled(Text, {
  name: 'OnboardingCategoriesTitle',
  fontFamily: '$heading',
  fontSize: 24,
  fontWeight: '700',
  color: '$textPrimary',
});

const Subtitle = styled(Text, {
  name: 'OnboardingCategoriesSubtitle',
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

const CategoryCard = styled(View, {
  name: 'CategoryCard',
  borderWidth: 2,
  borderRadius: '$lg',
  padding: '$lg',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$sm',
  cursor: 'pointer',
  pressStyle: { scale: 0.97 },
  minWidth: 100,
  flex: 1,

  variants: {
    selected: {
      true: {
        borderColor: '$brandPrimary',
        backgroundColor: '$parchment',
      },
      false: {
        borderColor: '$borderDefault',
        backgroundColor: '$white',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const CategoryEmoji = styled(Text, {
  name: 'CategoryEmoji',
  fontSize: 28,
  textAlign: 'center',
});

const CategoryName = styled(Text, {
  name: 'CategoryName',
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  color: '$textPrimary',
  textAlign: 'center',
});

const EditLink = styled(Text, {
  name: 'EditLink',
  fontFamily: '$body',
  fontSize: 12,
  color: '$brandPrimary',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

const AddCustomButton = styled(View, {
  name: 'AddCustomButton',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  padding: '$lg',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$sm',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
  minWidth: 100,
  flex: 1,
});

export function OnboardingCategoriesView({
  categories,
  onToggleCategory,
  onEditCategory,
  onAddCustom,
  onNext,
  onBack,
  onSkip,
  saving = false,
}: OnboardingCategoriesViewProps) {
  const { t } = useTranslation();

  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      testID="onboarding-categories-view"
    >
      <OnboardingProgressBar currentStep={3} totalSteps={4} />

      <YStack gap="$sm">
        <Title testID="categories-title">
          {t('onboarding.categories.title')}
        </Title>
        <Subtitle testID="categories-subtitle">
          {t('onboarding.categories.subtitle')}
        </Subtitle>
      </YStack>

      {/* Category Grid */}
      <XStack flexWrap="wrap" gap="$md" testID="categories-grid">
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            selected={category.selected}
            onPress={() => onToggleCategory(index)}
            testID={`category-card-${index}`}
            role="checkbox"
            aria-checked={category.selected}
            aria-label={t(category.nameKey)}
          >
            <CategoryEmoji>{category.icon}</CategoryEmoji>
            <CategoryName>{t(category.nameKey)}</CategoryName>
            <EditLink
              onPress={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onEditCategory(index);
              }}
              testID={`category-edit-${index}`}
              role="button"
              aria-label={`${t('common.edit')} ${t(category.nameKey)}`}
            >
              {t('common.edit')}
            </EditLink>
          </CategoryCard>
        ))}
        <AddCustomButton
          onPress={onAddCustom}
          testID="add-custom-button"
          role="button"
          aria-label={t('onboarding.categories.addCustom')}
        >
          <Text fontSize={28}>{'+'}</Text>
          <CategoryName>{t('onboarding.categories.addCustom')}</CategoryName>
        </AddCustomButton>
      </XStack>

      {/* Navigation */}
      <XStack justifyContent="space-between" alignItems="center">
        <NavButton
          onPress={onBack}
          testID="back-button"
          role="button"
          aria-label={t('common.back')}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {t('common.back')}
          </Text>
        </NavButton>
        <PrimaryButton
          label={t('common.next')}
          onPress={onNext}
          loading={saving}
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
