import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import {
  OnboardingWelcomeView,
  OnboardingTripFormView,
  OnboardingCategoriesView,
  OnboardingReadyView,
  OnboardingProgressBar,
} from '@repo/ui';
import type { CategoryOption } from '@repo/ui';
import {
  useUpdateUser,
  useCreateTravel,
  useCreateCategory,
  useCompleteOnboarding,
  useUserMe,
} from '@repo/api-client';
import { DEFAULT_CATEGORIES } from '@repo/core';

export interface OnboardingWizardProps {
  onNavigate: (path: string) => void;
}

const TOTAL_STEPS = 4;

export function OnboardingWizard({ onNavigate }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState('');
  const [categoryCount, setCategoryCount] = useState(0);
  const [categories, setCategories] = useState<CategoryOption[]>(() =>
    DEFAULT_CATEGORIES.map((cat) => ({
      nameKey: t(cat.nameKey),
      icon: cat.icon,
      color: cat.color,
      selected: true,
    })),
  );

  const { data: user } = useUserMe();
  const updateUser = useUpdateUser();
  const createTravel = useCreateTravel();
  const createCategory = useCreateCategory(tripId ?? '');
  const completeOnboarding = useCompleteOnboarding();

  const handleSkip = useCallback(() => {
    completeOnboarding.mutate(undefined, {
      onSuccess: () => {
        onNavigate('/travels');
      },
    });
  }, [completeOnboarding, onNavigate]);

  const handleStep1Next = useCallback(
    (name?: string) => {
      if (name && name.trim()) {
        updateUser.mutate(
          { name: name.trim() },
          {
            onSuccess: () => setStep(2),
          },
        );
      } else {
        setStep(2);
      }
    },
    [updateUser],
  );

  const handleStep2Next = useCallback(
    (data: {
      name: string;
      description: string;
      currency: string;
      budget: number;
      startDate: string;
      endDate: string;
    }) => {
      createTravel.mutate(data, {
        onSuccess: (travel) => {
          setTripId(travel.id);
          setTripName(travel.name);
          setStep(3);
        },
      });
    },
    [createTravel],
  );

  const handleStep3Next = useCallback(async () => {
    if (!tripId) return;

    const selectedCategories = categories.filter((c) => c.selected);
    setCategoryCount(selectedCategories.length);

    for (const cat of selectedCategories) {
      await createCategory.mutateAsync({
        name: cat.nameKey,
        icon: cat.icon,
        color: cat.color,
      });
    }

    setStep(4);
  }, [tripId, categories, createCategory]);

  const handleToggleCategory = useCallback((index: number) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, selected: !cat.selected } : cat,
      ),
    );
  }, []);

  const handleFinish = useCallback(
    (destination: string) => {
      completeOnboarding.mutate(undefined, {
        onSuccess: () => {
          onNavigate(destination);
        },
      });
    },
    [completeOnboarding, onNavigate],
  );

  const showNameInput = !user?.name;

  return (
    <YStack flex={1} testID="onboarding-wizard">
      <OnboardingProgressBar
        currentStep={step}
        totalSteps={TOTAL_STEPS}
      />

      {step === 1 && (
        <OnboardingWelcomeView
          title={t('onboarding.welcome.title')}
          subtitle={t('onboarding.welcome.subtitle')}
          nameLabel={t('onboarding.welcome.namePrompt')}
          namePlaceholder={t('onboarding.welcome.namePrompt')}
          getStartedLabel={t('onboarding.welcome.getStarted')}
          skipLabel={t('onboarding.welcome.skip')}
          showNameInput={showNameInput}
          saving={updateUser.isPending}
          onNext={handleStep1Next}
          onSkip={handleSkip}
        />
      )}

      {step === 2 && (
        <OnboardingTripFormView
          title={t('onboarding.trip.title')}
          subtitle={t('onboarding.trip.subtitle')}
          nextLabel={t('onboarding.next')}
          skipLabel={t('onboarding.skip')}
          saving={createTravel.isPending}
          onNext={handleStep2Next}
          onSkip={handleSkip}
        />
      )}

      {step === 3 && (
        <OnboardingCategoriesView
          title={t('onboarding.categories.title')}
          subtitle={t('onboarding.categories.subtitle')}
          nextLabel={t('onboarding.next')}
          skipLabel={t('onboarding.skip')}
          categories={categories}
          saving={createCategory.isPending}
          onToggleCategory={handleToggleCategory}
          onNext={handleStep3Next}
          onSkip={handleSkip}
        />
      )}

      {step === 4 && (
        <OnboardingReadyView
          title={t('onboarding.ready.title')}
          subtitle={
            tripId
              ? t('onboarding.ready.summary', { tripName, count: categoryCount })
              : t('onboarding.ready.title')
          }
          addExpenseLabel={t('onboarding.ready.addExpense')}
          inviteMembersLabel={t('onboarding.ready.inviteMembers')}
          goToDashboardLabel={t('onboarding.ready.goToDashboard')}
          completing={completeOnboarding.isPending}
          onAddExpense={() =>
            handleFinish(
              tripId ? `/travels/${tripId}/expenses` : '/travels',
            )
          }
          onInviteMembers={() =>
            handleFinish(
              tripId ? `/travels/${tripId}/members` : '/travels',
            )
          }
          onGoToDashboard={() =>
            handleFinish(tripId ? `/travels/${tripId}` : '/travels')
          }
        />
      )}
    </YStack>
  );
}
