import { useTranslation } from 'react-i18next';
import { YStack, Text } from 'tamagui';
import { Heading } from '../../atoms';
import { PinInput } from '../../molecules/PinInput';

export interface PinVerifyViewProps {
  email: string;
  pin: string;
  onPinChange: (value: string) => void;
  onPinComplete: (value: string) => void;
  verifying: boolean;
  error: string | null;
  secondsLeft: number;
  resendCooldown: number;
  onResend: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PinVerifyView({
  email,
  pin,
  onPinChange,
  onPinComplete,
  verifying,
  error,
  secondsLeft,
  resendCooldown,
  onResend,
}: PinVerifyViewProps) {
  const { t } = useTranslation();
  const formattedTime = formatTime(secondsLeft);
  const isExpired = secondsLeft === 0;

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
      <Heading level={2}>{t('auth.enterCode')}</Heading>
      <Text
        fontFamily="$body"
        fontSize={14}
        color="$textSecondary"
        textAlign="center"
        lineHeight={20}
      >
        {t('auth.codeSentTo', { email })}
      </Text>

      <YStack width="100%" maxWidth={360} gap="$md" alignItems="center">
        <PinInput
          length={6}
          value={pin}
          onChange={onPinChange}
          onComplete={onPinComplete}
          autoFocus
          disabled={verifying}
        />

        {error && (
          <Text
            fontFamily="$body"
            fontSize={13}
            color="$statusDanger"
            textAlign="center"
            aria-live="polite"
            role="alert"
          >
            {error}
          </Text>
        )}

        {verifying && (
          <Text fontFamily="$body" fontSize={13} color="$textSecondary">
            {t('common.loading')}
          </Text>
        )}

        {!isExpired && (
          <Text fontFamily="$body" fontSize={13} color="$textSecondary">
            {t('auth.expiresIn', { time: formattedTime })}
          </Text>
        )}

        {isExpired && !error && (
          <Text
            fontFamily="$body"
            fontSize={13}
            color="$statusDanger"
            aria-live="polite"
            role="alert"
          >
            {t('auth.codeExpired')}
          </Text>
        )}

        <Text
          fontFamily="$body"
          fontSize={14}
          color={resendCooldown > 0 ? '$textTertiary' : '$brandPrimary'}
          cursor={resendCooldown > 0 ? 'default' : 'pointer'}
          opacity={resendCooldown > 0 ? 0.5 : 1}
          onPress={resendCooldown > 0 ? undefined : onResend}
          aria-disabled={resendCooldown > 0}
          role="button"
          tabIndex={0}
        >
          {resendCooldown > 0
            ? `${t('auth.resendCode')} (${resendCooldown}s)`
            : t('auth.resendCode')}
        </Text>
      </YStack>
    </YStack>
  );
}
