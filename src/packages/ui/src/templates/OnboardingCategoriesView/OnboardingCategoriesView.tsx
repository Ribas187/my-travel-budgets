import { YStack, XStack } from 'tamagui';

import { Heading, Body, PrimaryButton } from '../../atoms';

export interface CategoryOption {
  nameKey: string;
  icon: string;
  color: string;
  selected: boolean;
}

export interface OnboardingCategoriesViewProps {
  title: string;
  subtitle: string;
  nextLabel: string;
  skipLabel: string;
  categories: CategoryOption[];
  saving: boolean;
  onToggleCategory: (index: number) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingCategoriesView({
  title,
  subtitle,
  nextLabel,
  skipLabel,
  categories,
  saving,
  onToggleCategory,
  onNext,
  onSkip,
}: OnboardingCategoriesViewProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$6">
      <YStack alignItems="center" gap="$3">
        <Heading size="$8" textAlign="center">{title}</Heading>
        <Body textAlign="center" color="$gray11">{subtitle}</Body>
      </YStack>

      <XStack flexWrap="wrap" gap="$3" justifyContent="center" maxWidth={400}>
        {categories.map((cat, i) => (
          <YStack
            key={cat.nameKey}
            width={100}
            height={100}
            borderRadius="$4"
            backgroundColor={cat.selected ? cat.color : '$gray3'}
            alignItems="center"
            justifyContent="center"
            gap="$1"
            pressStyle={{ opacity: 0.7 }}
            cursor="pointer"
            onPress={() => onToggleCategory(i)}
            opacity={cat.selected ? 1 : 0.5}
            testID={`onboarding-category-${i}`}
            role="button"
          >
            <Body fontSize={28}>{cat.icon}</Body>
            <Body fontSize={12} color={cat.selected ? 'white' : '$gray11'}>
              {cat.nameKey}
            </Body>
          </YStack>
        ))}
      </XStack>

      <XStack gap="$3" flexDirection="column" alignItems="center" width="100%" maxWidth={400}>
        <PrimaryButton
          width="100%"
          onPress={onNext}
          disabled={saving}
          testID="onboarding-categories-next"
        >
          {nextLabel}
        </PrimaryButton>
        <Body
          color="$gray10"
          pressStyle={{ opacity: 0.7 }}
          cursor="pointer"
          onPress={onSkip}
          textAlign="center"
          role="button"
          testID="onboarding-skip"
        >
          {skipLabel}
        </Body>
      </XStack>
    </YStack>
  );
}
