import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { OnboardingWizard } from '@repo/features';

export const Route = createFileRoute('/_authenticated/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (path: string) => {
      navigate({ to: path });
    },
    [navigate],
  );

  return <OnboardingWizard onNavigate={handleNavigate} />;
}
