import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { YStack, Text, Input, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Heading, PrimaryButton } from '@repo/ui';

import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/apiClient';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to travels
  if (isAuthenticated) {
    navigate({ to: '/travels' });
    return null;
  }

  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.auth.requestMagicLink(email.trim());
      setSent(true);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

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
          aria-label={t('auth.emailPlaceholder')}
        />

        {error && (
          <Text fontFamily="$body" fontSize={13} color="$statusDanger">
            {error}
          </Text>
        )}

        <PrimaryButton
          label={t('auth.magicLink')}
          onPress={handleSendMagicLink}
          loading={loading}
          disabled={!email.trim()}
        />
      </YStack>
    </YStack>
  );
}
