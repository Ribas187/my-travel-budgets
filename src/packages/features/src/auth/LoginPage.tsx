import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginFormView, CheckEmailView, PinVerifyView } from '@repo/ui';

import { usePinLogin } from './usePinLogin';

type AuthMethod = 'link' | 'pin';

export interface LoginPageProps {
  isAuthenticated: boolean;
  login: (token: string) => void;
  onLoginSuccess: () => void;
  requestMagicLink: (email: string) => Promise<void>;
  requestPin: (email: string) => Promise<void>;
  verifyPin: (email: string, pin: string) => Promise<{ accessToken: string }>;
}

export function LoginPage({
  isAuthenticated,
  login,
  onLoginSuccess,
  requestMagicLink,
  requestPin,
  verifyPin,
}: LoginPageProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('pin');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pinLogin = usePinLogin({
    email,
    requestPin,
    verifyPin,
    login,
    onSuccess: onLoginSuccess,
  });

  // Redirect authenticated users after render (not during)
  useEffect(() => {
    if (isAuthenticated) {
      onLoginSuccess();
    }
  }, [isAuthenticated, onLoginSuccess]);

  if (isAuthenticated) return null;

  // Magic link "check email" view
  if (sent) {
    return (
      <CheckEmailView
        email={email}
        onGoBack={() => {
          setSent(false);
          setSubmitError(null);
        }}
      />
    );
  }

  // PIN input view
  if (pinLogin.pinSent) {
    return (
      <PinVerifyView
        email={email}
        pin={pinLogin.pin}
        onPinChange={pinLogin.handlePinChange}
        onPinComplete={pinLogin.handlePinComplete}
        verifying={pinLogin.verifying}
        error={pinLogin.error}
        secondsLeft={pinLogin.secondsLeft}
        resendCooldown={pinLogin.resendCooldown}
        onResend={pinLogin.handleResendCode}
      />
    );
  }

  // Login form
  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      if (authMethod === 'link') {
        await requestMagicLink(email.trim());
        setSent(true);
      } else {
        await pinLogin.handleRequestPin();
      }
    } catch {
      setSubmitError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginFormView
      email={email}
      onEmailChange={setEmail}
      authMethod={authMethod}
      onAuthMethodChange={(method) => setAuthMethod(method as AuthMethod)}
      onSubmit={handleSubmit}
      loading={loading}
      error={submitError ?? pinLogin.error}
      submitLabel={authMethod === 'link' ? t('auth.sendLink') : t('auth.sendCode')}
    />
  );
}
