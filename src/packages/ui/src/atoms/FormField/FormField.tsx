import { styled, YStack, Text, Input } from 'tamagui';

export const FormField = styled(YStack, {
  name: 'FormField',
  gap: '$xs',
});

export const FormLabel = styled(Text, {
  name: 'FormLabel',
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textSecondary',
});

export const SectionLabel = styled(Text, {
  name: 'SectionLabel',
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textTertiary',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
});

export const FormInput = styled(Input, {
  name: 'FormInput',
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

export const ErrorText = styled(Text, {
  name: 'ErrorText',
  fontFamily: '$body',
  fontSize: 13,
  color: '$statusDanger',
});
