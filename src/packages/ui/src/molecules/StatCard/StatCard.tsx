import { styled, YStack, Text } from 'tamagui';

const CardFrame = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$cardPadding',
  gap: '$xs',
});

const LabelText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textTertiary',
});

const ValueText = styled(Text, {
  fontFamily: '$heading',
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.64,
  color: '$textPrimary',
});

const HelperText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textTertiary',
});

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  valueColor?: string;
}

export function StatCard({ label, value, helper, valueColor }: StatCardProps) {
  return (
    <CardFrame>
      <LabelText>{label}</LabelText>
      <ValueText {...(valueColor && { color: valueColor })}>{value}</ValueText>
      {helper && <HelperText>{helper}</HelperText>}
    </CardFrame>
  );
}
