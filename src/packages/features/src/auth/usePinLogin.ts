import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const PIN_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

interface UsePinLoginOptions {
  email: string;
  requestPin: (email: string) => Promise<void>;
  verifyPin: (email: string, pin: string) => Promise<{ accessToken: string }>;
  login: (token: string) => void;
  onSuccess: () => void;
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return '';
}

export function usePinLogin({ email, requestPin, verifyPin, login, onSuccess }: UsePinLoginOptions) {
  const { t } = useTranslation();

  const [pin, setPin] = useState('');
  const [pinSent, setPinSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PIN_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

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

  const handleVerifyPin = useCallback(
    async (pinValue: string) => {
      if (verifying) return;
      setVerifying(true);
      setError(null);
      try {
        const session = await verifyPin(email, pinValue);
        login(session.accessToken);
        onSuccess();
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
    [email, verifying, login, onSuccess, verifyPin, t],
  );

  function handlePinChange(value: string) {
    setPin(value);
    setError(null);
    hasAutoSubmitted.current = false;
  }

  function handlePinComplete(value: string) {
    if (!hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleVerifyPin(value);
    }
  }

  async function handleRequestPin() {
    setError(null);
    try {
      await requestPin(email.trim());
      setPinSent(true);
      setSecondsLeft(PIN_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setPin('');
      hasAutoSubmitted.current = false;
    } catch {
      setError(t('common.error'));
    }
  }

  async function handleResendCode() {
    setError(null);
    try {
      await requestPin(email.trim());
      setSecondsLeft(PIN_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setPin('');
      hasAutoSubmitted.current = false;
    } catch {
      setError(t('common.error'));
    }
  }

  return {
    pin,
    pinSent,
    setPinSent,
    secondsLeft,
    resendCooldown,
    verifying,
    error,
    setError,
    handlePinChange,
    handlePinComplete,
    handleRequestPin,
    handleResendCode,
  };
}
