import { useState, useEffect, useCallback, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { YStack, XStack, Text, Input } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Heading, PrimaryButton } from '@repo/ui';
import { OTPInput, type SlotProps, REGEXP_ONLY_DIGITS } from 'input-otp';

import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/apiClient';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const PIN_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

type AuthMethod = 'link' | 'pin';

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('pin');
  const [sent, setSent] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PIN flow state
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PIN_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const hasAutoSubmitted = useRef(false);

  // Redirect authenticated users to travels
  if (isAuthenticated) {
    navigate({ to: '/travels' });
    return null;
  }

  // Countdown timer for PIN expiry
  useEffect(() => {
    if (!pinSent) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pinSent]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verifyPin = useCallback(
    async (pinValue: string) => {
      if (verifying) return;
      setVerifying(true);
      setError(null);
      try {
        const session = await apiClient.auth.verifyPin(email, pinValue);
        login(session.accessToken);
        navigate({ to: '/travels' });
      } catch (err: unknown) {
        const message = extractErrorMessage(err);
        if (message.toLowerCase().includes('expired')) {
          setError(t('auth.codeExpired'));
        } else if (message.toLowerCase().includes('too many')) {
          setError(t('auth.tooManyAttempts'));
        } else {
          setError(t('auth.invalidCode'));
        }
        setPin('');
        hasAutoSubmitted.current = false;
      } finally {
        setVerifying(false);
      }
    },
    [email, verifying, login, navigate, t],
  );

  function handlePinChange(value: string) {
    setPin(value);
    setError(null);
    hasAutoSubmitted.current = false;
  }

  function handlePinComplete(value: string) {
    if (!hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      verifyPin(value);
    }
  }

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (authMethod === 'link') {
        await apiClient.auth.requestMagicLink(email.trim());
        setSent(true);
      } else {
        await apiClient.auth.requestPin(email.trim());
        setPinSent(true);
        setSecondsLeft(PIN_EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setPin('');
        hasAutoSubmitted.current = false;
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    try {
      await apiClient.auth.requestPin(email.trim());
      setSecondsLeft(PIN_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setPin('');
      hasAutoSubmitted.current = false;
    } catch {
      setError(t('common.error'));
    }
  }

  // Magic link "check email" view
  if (sent) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
        <Heading level={2}>{t('auth.checkEmail')}</Heading>
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$textSecondary"
          textAlign="center"
          lineHeight={20}
        >
          {t('auth.checkEmailDescription')}
        </Text>
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
          {email}
        </Text>
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$brandPrimary"
          cursor="pointer"
          onPress={() => {
            setSent(false);
            setError(null);
          }}
        >
          {t('auth.magicLink')}
        </Text>
      </YStack>
    );
  }

  // PIN input view
  if (pinSent) {
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
          <OTPInput
            maxLength={6}
            value={pin}
            onChange={handlePinChange}
            onComplete={handlePinComplete}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            autoFocus
            disabled={verifying}
            render={({ slots }) => (
              <XStack gap="$sm" justifyContent="center">
                {slots.map((slot, idx) => (
                  <OTPSlot key={idx} {...slot} />
                ))}
              </XStack>
            )}
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
            onPress={resendCooldown > 0 ? undefined : handleResendCode}
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

  // Login form
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
      <Heading level={1}>{t('app.title')}</Heading>
      <Text fontFamily="$body" color="$textSecondary" marginBottom="$lg">
        {t('auth.login')}
      </Text>

      <YStack width="100%" maxWidth={360} gap="$md">
        <label
          htmlFor="login-email"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        >
          {t('auth.emailPlaceholder')}
        </label>
        <Input
          id="login-email"
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          backgroundColor="$backgroundInput"
          borderWidth={0}
          borderRadius="$lg"
          paddingHorizontal="$lg"
          paddingVertical="$md"
          fontFamily="$body"
          fontSize={15}
          minHeight={48}
          aria-label={t('auth.emailPlaceholder')}
        />

        <MethodSelector authMethod={authMethod} onChangeMethod={setAuthMethod} />

        {error && (
          <Text fontFamily="$body" fontSize={13} color="$statusDanger">
            {error}
          </Text>
        )}

        <PrimaryButton
          label={authMethod === 'link' ? t('auth.sendLink') : t('auth.sendCode')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!email.trim()}
        />
      </YStack>
    </YStack>
  );
}

interface MethodSelectorProps {
  authMethod: AuthMethod;
  onChangeMethod: (method: AuthMethod) => void;
}

function MethodSelector({ authMethod, onChangeMethod }: MethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <XStack
      width="100%"
      borderRadius="$lg"
      backgroundColor="$backgroundSecondary"
      padding={3}
      role="radiogroup"
      aria-label={t('auth.login')}
    >
      <MethodOption
        label={t('auth.sendCode')}
        selected={authMethod === 'pin'}
        onPress={() => onChangeMethod('pin')}
        value="pin"
      />
      <MethodOption
        label={t('auth.sendLink')}
        selected={authMethod === 'link'}
        onPress={() => onChangeMethod('link')}
        value="link"
      />
    </XStack>
  );
}

interface MethodOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  value: string;
}

function MethodOption({ label, selected, onPress, value }: MethodOptionProps) {
  return (
    <XStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      paddingVertical="$sm"
      borderRadius="$md"
      backgroundColor={selected ? '$background' : 'transparent'}
      cursor="pointer"
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      tabIndex={0}
      data-value={value}
      hoverStyle={{
        opacity: selected ? 1 : 0.8,
      }}
    >
      <Text
        fontFamily="$body"
        fontSize={13}
        fontWeight={selected ? '600' : '400'}
        color={selected ? '$textPrimary' : '$textSecondary'}
      >
        {label}
      </Text>
    </XStack>
  );
}

function OTPSlot(props: SlotProps) {
  return (
    <XStack
      width={48}
      height={56}
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderColor={props.isActive ? '$brandPrimary' : '$borderDefault'}
      borderRadius="$md"
      backgroundColor="$backgroundInput"
    >
      <Text fontFamily="$body" fontSize={24} fontWeight="600" color="$textPrimary">
        {props.char ?? ''}
      </Text>
    </XStack>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return '';
}
