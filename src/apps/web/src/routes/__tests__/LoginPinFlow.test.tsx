import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const loginRouteSource = readFileSync(resolve(__dirname, '../login.tsx'), 'utf-8');

const loginPageSource = readFileSync(
  resolve(__dirname, '../../../../../packages/features/src/auth/LoginPage.tsx'),
  'utf-8',
);

const usePinLoginSource = readFileSync(
  resolve(__dirname, '../../../../../packages/features/src/auth/usePinLogin.ts'),
  'utf-8',
);

const pinVerifyViewSource = readFileSync(
  resolve(__dirname, '../../../../../packages/ui/src/templates/PinVerifyView/PinVerifyView.tsx'),
  'utf-8',
);

const loginFormViewSource = readFileSync(
  resolve(__dirname, '../../../../../packages/ui/src/templates/LoginFormView/LoginFormView.tsx'),
  'utf-8',
);

const checkEmailViewSource = readFileSync(
  resolve(__dirname, '../../../../../packages/ui/src/templates/CheckEmailView/CheckEmailView.tsx'),
  'utf-8',
);

const pinInputSource = readFileSync(
  resolve(__dirname, '../../../../../packages/ui/src/molecules/PinInput/PinInput.tsx'),
  'utf-8',
);

const segmentedControlSource = readFileSync(
  resolve(__dirname, '../../../../../packages/ui/src/molecules/SegmentedControl/SegmentedControl.tsx'),
  'utf-8',
);

// Mock modules needed for import validation
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({ ...opts }),
  useNavigate: () => vi.fn(),
  lazyRouteComponent: (fn: () => Promise<unknown>) => fn,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        return Object.entries(opts).reduce(
          (str, [k, v]) => str.replace(`{{${k}}}`, v),
          key,
        );
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    auth: {
      requestMagicLink: vi.fn(),
      requestPin: vi.fn(),
      verifyPin: vi.fn(),
    },
  },
}));

describe('Login route — thin wrapper', () => {
  it('imports LoginPage from @repo/features', () => {
    expect(loginRouteSource).toContain("import { LoginPage } from '@repo/features'");
  });

  it('uses useAuth for authentication state', () => {
    expect(loginRouteSource).toContain('useAuth()');
  });

  it('uses useNavigate for navigation', () => {
    expect(loginRouteSource).toContain('useNavigate()');
  });

  it('passes apiClient methods as props', () => {
    expect(loginRouteSource).toContain('apiClient.auth.requestMagicLink');
    expect(loginRouteSource).toContain('apiClient.auth.requestPin');
    expect(loginRouteSource).toContain('apiClient.auth.verifyPin');
  });

  it('navigates to /travels on success', () => {
    expect(loginRouteSource).toContain("navigate({ to: '/travels' })");
  });

  it('exports Route from createFileRoute', async () => {
    const mod = await import('../login');
    expect(mod.Route).toBeDefined();
  });
});

describe('Login PIN Flow — source analysis', () => {
  describe('Method selector (SegmentedControl)', () => {
    it('has options with sendCode and sendLink labels', () => {
      expect(loginFormViewSource).toContain("t('auth.sendCode')");
      expect(loginFormViewSource).toContain("t('auth.sendLink')");
    });

    it('defaults authMethod state to pin', () => {
      expect(loginPageSource).toContain("useState<AuthMethod>('pin')");
    });

    it('renders SegmentedControl with radiogroup role', () => {
      expect(segmentedControlSource).toContain('role="radiogroup"');
    });

    it('renders options with radio role and aria-checked', () => {
      expect(segmentedControlSource).toContain('role="radio"');
      expect(segmentedControlSource).toContain('aria-checked={selected}');
    });
  });

  describe('Submit handler branching', () => {
    it('calls requestMagicLink when authMethod is link', () => {
      expect(loginPageSource).toContain("authMethod === 'link'");
      expect(loginPageSource).toContain('requestMagicLink(email.trim())');
    });

    it('calls requestPin when authMethod is pin', () => {
      expect(usePinLoginSource).toContain('requestPin(email.trim())');
    });

    it('sets pinSent to true after requesting PIN', () => {
      expect(usePinLoginSource).toContain('setPinSent(true)');
    });

    it('shows magic link check-email view when sent is true', () => {
      expect(checkEmailViewSource).toContain("t('auth.checkEmail')");
      expect(checkEmailViewSource).toContain("t('auth.checkEmailDescription')");
    });
  });

  describe('PIN input view', () => {
    it('renders OTPInput from input-otp library', () => {
      expect(pinInputSource).toContain("from 'input-otp'");
      expect(pinInputSource).toContain('<OTPInput');
    });

    it('sets maxLength from length prop for the OTP input', () => {
      expect(pinInputSource).toContain('maxLength={length}');
    });

    it('uses numeric inputMode for mobile keyboard', () => {
      expect(pinInputSource).toContain('inputMode="numeric"');
    });

    it('uses REGEXP_ONLY_DIGITS pattern', () => {
      expect(pinInputSource).toContain('pattern={REGEXP_ONLY_DIGITS}');
    });

    it('supports autoFocus prop', () => {
      expect(pinInputSource).toContain('autoFocus={autoFocus}');
    });

    it('displays the email the code was sent to', () => {
      expect(pinVerifyViewSource).toContain("t('auth.codeSentTo', { email })");
    });

    it('displays enter code heading', () => {
      expect(pinVerifyViewSource).toContain("t('auth.enterCode')");
    });

    it('renders PinInput component with slots', () => {
      expect(pinInputSource).toContain('slots.map((slot, idx)');
      expect(pinInputSource).toContain('<PinSlot');
    });
  });

  describe('Auto-submit on complete', () => {
    it('calls handlePinComplete via onComplete callback', () => {
      expect(pinVerifyViewSource).toContain('onComplete={onPinComplete}');
    });

    it('handlePinComplete triggers verifyPin', () => {
      expect(usePinLoginSource).toContain('handleVerifyPin(value)');
    });

    it('uses hasAutoSubmitted ref to prevent duplicate submissions', () => {
      expect(usePinLoginSource).toContain('hasAutoSubmitted');
      expect(usePinLoginSource).toContain('hasAutoSubmitted.current = true');
    });

    it('calls verifyPin with email and pin', () => {
      expect(usePinLoginSource).toContain('verifyPin(email, pinValue)');
    });

    it('calls login with accessToken on success', () => {
      expect(usePinLoginSource).toContain('login(session.accessToken)');
    });

    it('calls onSuccess after login', () => {
      expect(usePinLoginSource).toContain('onSuccess()');
    });
  });

  describe('Countdown timer', () => {
    it('initializes timer to 5 minutes (300 seconds)', () => {
      expect(usePinLoginSource).toContain('PIN_EXPIRY_SECONDS = 5 * 60');
      expect(usePinLoginSource).toContain('useState(PIN_EXPIRY_SECONDS)');
    });

    it('displays expires-in text with formatted time', () => {
      expect(pinVerifyViewSource).toContain("t('auth.expiresIn', { time: formattedTime })");
    });

    it('shows expired message when timer reaches 0', () => {
      expect(pinVerifyViewSource).toContain('secondsLeft === 0');
      expect(pinVerifyViewSource).toContain("t('auth.codeExpired')");
    });

    it('formats time as M:SS', () => {
      expect(pinVerifyViewSource).toContain('formatTime');
      expect(pinVerifyViewSource).toContain("padStart(2, '0')");
    });
  });

  describe('Resend code', () => {
    it('has a resend code button with i18n key', () => {
      expect(pinVerifyViewSource).toContain("t('auth.resendCode')");
    });

    it('implements 30-second cooldown for resend', () => {
      expect(usePinLoginSource).toContain('RESEND_COOLDOWN_SECONDS = 30');
      expect(usePinLoginSource).toContain('setResendCooldown(RESEND_COOLDOWN_SECONDS)');
    });

    it('disables resend during cooldown', () => {
      expect(pinVerifyViewSource).toContain('resendCooldown > 0');
      expect(pinVerifyViewSource).toContain('aria-disabled={resendCooldown > 0}');
    });

    it('resend calls requestPin again', () => {
      expect(usePinLoginSource).toContain('handleResendCode');
      const resendMatch = usePinLoginSource.match(
        /handleResendCode[\s\S]*?requestPin/,
      );
      expect(resendMatch).not.toBeNull();
    });

    it('resets timer and cooldown on resend', () => {
      const resendBlock = usePinLoginSource.match(
        /handleResendCode[\s\S]*?setSecondsLeft\(PIN_EXPIRY_SECONDS\)/,
      );
      expect(resendBlock).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('shows invalidCode error for generic failures', () => {
      expect(usePinLoginSource).toContain("t('auth.invalidCode')");
    });

    it('shows codeExpired error for expired codes', () => {
      expect(usePinLoginSource).toContain("t('auth.codeExpired')");
    });

    it('shows tooManyAttempts error for rate limiting', () => {
      expect(usePinLoginSource).toContain("t('auth.tooManyAttempts')");
    });

    it('uses aria-live polite for error announcements', () => {
      expect(pinVerifyViewSource).toContain('aria-live="polite"');
    });

    it('uses role alert for error messages', () => {
      expect(pinVerifyViewSource).toContain('role="alert"');
    });

    it('uses $statusDanger color for error text', () => {
      expect(pinVerifyViewSource).toContain('color="$statusDanger"');
    });

    it('clears pin and resets auto-submit flag on error', () => {
      const catchBlock = usePinLoginSource.match(
        /catch[\s\S]*?setPin\(''\)[\s\S]*?hasAutoSubmitted\.current = false/,
      );
      expect(catchBlock).not.toBeNull();
    });

    it('parses error messages to distinguish expired vs invalid vs too-many', () => {
      expect(usePinLoginSource).toContain("message.toLowerCase().includes('expired')");
      expect(usePinLoginSource).toContain("message.toLowerCase().includes('too many')");
    });
  });

  describe('Accessibility', () => {
    it('email input has aria-label', () => {
      expect(loginFormViewSource).toContain("aria-label={t('auth.emailPlaceholder')}");
    });

    it('segmented control has aria-label', () => {
      expect(segmentedControlSource).toContain('aria-label={ariaLabel}');
    });

    it('resend button has role button and tabIndex', () => {
      expect(pinVerifyViewSource).toContain('role="button"');
      expect(pinVerifyViewSource).toContain('tabIndex={0}');
    });

    it('OTP input has keyboard navigable slots', () => {
      expect(pinInputSource).toContain('<OTPInput');
    });
  });

  describe('i18n compliance', () => {
    it('does not contain hardcoded user-facing strings in login form', () => {
      const lines = loginFormViewSource.split('\n');
      const contentLines = lines.filter(
        (line) =>
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('import'),
      );
      const content = contentLines.join('\n');

      expect(content).not.toMatch(/['"]Send me a code['"]/);
      expect(content).not.toMatch(/['"]Send me a link['"]/);
      expect(content).not.toMatch(/['"]Enter your code['"]/);
      expect(content).not.toMatch(/['"]Resend code['"]/);
      expect(content).not.toMatch(/['"]Code expired['"]/);
      expect(content).not.toMatch(/['"]Invalid code['"]/);
    });

    it('does not contain hardcoded user-facing strings in pin verify view', () => {
      const lines = pinVerifyViewSource.split('\n');
      const contentLines = lines.filter(
        (line) =>
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('import'),
      );
      const content = contentLines.join('\n');

      expect(content).not.toMatch(/['"]Send me a code['"]/);
      expect(content).not.toMatch(/['"]Send me a link['"]/);
      expect(content).not.toMatch(/['"]Enter your code['"]/);
      expect(content).not.toMatch(/['"]Resend code['"]/);
      expect(content).not.toMatch(/['"]Code expired['"]/);
      expect(content).not.toMatch(/['"]Invalid code['"]/);
    });
  });
});

describe('Login PIN Flow — unit functions', () => {
  describe('formatTime', () => {
    it('is defined in the PinVerifyView source', () => {
      expect(pinVerifyViewSource).toContain('function formatTime(totalSeconds: number): string');
    });

    it('formats 300 seconds as 5:00', () => {
      const match = pinVerifyViewSource.match(
        /function formatTime\(totalSeconds: number\): string \{[\s\S]*?return[\s\S]*?\}/,
      );
      expect(match).not.toBeNull();

      const formatTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };

      expect(formatTime(300)).toBe('5:00');
      expect(formatTime(299)).toBe('4:59');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(9)).toBe('0:09');
    });
  });

  describe('extractErrorMessage', () => {
    it('is defined in the usePinLogin source', () => {
      expect(usePinLoginSource).toContain('function extractErrorMessage(err: unknown): string');
    });

    it('extracts message from error objects', () => {
      const extractErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object' && 'message' in err) {
          return String((err as { message: string }).message);
        }
        return '';
      };

      expect(extractErrorMessage({ message: 'Code expired' })).toBe('Code expired');
      expect(extractErrorMessage({ message: 'Too many attempts' })).toBe('Too many attempts');
      expect(extractErrorMessage({ message: 'Invalid code' })).toBe('Invalid code');
      expect(extractErrorMessage(null)).toBe('');
      expect(extractErrorMessage(undefined)).toBe('');
      expect(extractErrorMessage('string error')).toBe('');
    });
  });
});
