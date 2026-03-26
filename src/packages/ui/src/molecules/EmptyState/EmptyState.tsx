import { YStack, Text } from 'tamagui';
import { Heading, Body } from '../../atoms';
import { PrimaryButton } from '../../atoms';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta, testID }: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg" data-testid={testID}>
      <Text fontSize={48} role="img">{icon}</Text>
      <Heading level={3} textAlign="center">{title}</Heading>
      {description && <Body size="secondary" textAlign="center" color="$textTertiary">{description}</Body>}
      {ctaLabel && onCta && <PrimaryButton label={ctaLabel} onPress={onCta} />}
    </YStack>
  );
}
