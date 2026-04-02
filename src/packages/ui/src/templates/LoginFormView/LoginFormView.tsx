import { useTranslation } from 'react-i18next';
import { YStack, Text, Input } from 'tamagui';
import { Heading, PrimaryButton } from '../../atoms';
import { SegmentedControl } from '../../molecules/SegmentedControl';

export interface LoginFormViewProps {
  email: string;
  onEmailChange: (email: string) => void;
  authMethod: string;
  onAuthMethodChange: (method: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  submitLabel: string;
}

export function LoginFormView({
  email,
  onEmailChange,
  authMethod,
  onAuthMethodChange,
  onSubmit,
  loading,
  error,
  submitLabel,
}: LoginFormViewProps) {
  const { t } = useTranslation();

  const methodOptions = [
    { value: 'pin', label: t('auth.sendCode') },
    { value: 'link', label: t('auth.sendLink') },
  ];

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
          onChangeText={onEmailChange}
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

        <SegmentedControl
          options={methodOptions}
          value={authMethod}
          onChange={onAuthMethodChange}
          ariaLabel={t('auth.login')}
        />

        {error && (
          <Text fontFamily="$body" fontSize={13} color="$statusDanger">
            {error}
          </Text>
        )}

        <PrimaryButton
          label={submitLabel}
          onPress={onSubmit}
          loading={loading}
          disabled={!email.trim()}
        />
      </YStack>
    </YStack>
  );
}
