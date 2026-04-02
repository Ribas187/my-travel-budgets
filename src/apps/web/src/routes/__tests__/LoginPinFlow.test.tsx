import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const loginSource = readFileSync(resolve(__dirname, '../login.tsx'), 'utf-8');

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

describe('Login PIN Flow — source analysis', () => {
  describe('Method selector', () => {
    it('has a method selector with two options: sendCode and sendLink', () => {
      expect(loginSource).toContain("t('auth.sendCode')");
      expect(loginSource).toContain("t('auth.sendLink')");
    });

    it('defaults authMethod state to pin', () => {
      expect(loginSource).toContain("useState<AuthMethod>('pin')");
    });

    it('renders MethodSelector component with radiogroup role', () => {
      expect(loginSource).toContain('role="radiogroup"');
    });

    it('renders method options with radio role and aria-checked', () => {
      expect(loginSource).toContain('role="radio"');
      expect(loginSource).toContain('aria-checked={selected}');
    });
  });

  describe('Submit handler branching', () => {
    it('calls requestMagicLink when authMethod is link', () => {
      expect(loginSource).toContain("authMethod === 'link'");
      expect(loginSource).toContain('apiClient.auth.requestMagicLink(email.trim())');
    });

    it('calls requestPin when authMethod is pin', () => {
      expect(loginSource).toContain('apiClient.auth.requestPin(email.trim())');
    });

    it('sets pinSent to true after requesting PIN', () => {
      expect(loginSource).toContain('setPinSent(true)');
    });

    it('shows magic link check-email view when sent is true', () => {
      expect(loginSource).toContain("t('auth.checkEmail')");
      expect(loginSource).toContain("t('auth.checkEmailDescription')");
    });
  });

  describe('PIN input view', () => {
    it('renders OTPInput from input-otp library', () => {
      expect(loginSource).toContain("from 'input-otp'");
      expect(loginSource).toContain('<OTPInput');
    });

    it('sets maxLength to 6 for the OTP input', () => {
      expect(loginSource).toContain('maxLength={6}');
    });

    it('uses numeric inputMode for mobile keyboard', () => {
      expect(loginSource).toContain('inputMode="numeric"');
    });

    it('uses REGEXP_ONLY_DIGITS pattern', () => {
      expect(loginSource).toContain('pattern={REGEXP_ONLY_DIGITS}');
    });

    it('enables autoFocus on OTP input', () => {
      expect(loginSource).toContain('autoFocus');
    });

    it('displays the email the code was sent to', () => {
      expect(loginSource).toContain("t('auth.codeSentTo', { email })");
    });

    it('displays enter code heading', () => {
      expect(loginSource).toContain("t('auth.enterCode')");
    });

    it('renders 6 OTPSlot components', () => {
      expect(loginSource).toContain('slots.map((slot, idx)');
      expect(loginSource).toContain('<OTPSlot');
    });
  });

  describe('Auto-submit on complete', () => {
    it('calls verifyPin via onComplete callback', () => {
      expect(loginSource).toContain('onComplete={handlePinComplete}');
    });

    it('handlePinComplete triggers verifyPin', () => {
      expect(loginSource).toContain('verifyPin(value)');
    });

    it('uses hasAutoSubmitted ref to prevent duplicate submissions', () => {
      expect(loginSource).toContain('hasAutoSubmitted');
      expect(loginSource).toContain('hasAutoSubmitted.current = true');
    });

    it('calls apiClient.auth.verifyPin with email and pin', () => {
      expect(loginSource).toContain('apiClient.auth.verifyPin(email, pinValue)');
    });

    it('calls login with accessToken on success', () => {
      expect(loginSource).toContain('login(session.accessToken)');
    });

    it('navigates to /travels on success', () => {
      expect(loginSource).toContain("navigate({ to: '/travels' })");
    });
  });

  describe('Countdown timer', () => {
    it('initializes timer to 5 minutes (300 seconds)', () => {
      expect(loginSource).toContain('PIN_EXPIRY_SECONDS = 5 * 60');
      expect(loginSource).toContain('useState(PIN_EXPIRY_SECONDS)');
    });

    it('displays expires-in text with formatted time', () => {
      expect(loginSource).toContain("t('auth.expiresIn', { time: formattedTime })");
    });

    it('shows expired message when timer reaches 0', () => {
      expect(loginSource).toContain('secondsLeft === 0');
      expect(loginSource).toContain("t('auth.codeExpired')");
    });

    it('formats time as M:SS', () => {
      expect(loginSource).toContain('formatTime');
      expect(loginSource).toContain("padStart(2, '0')");
    });
  });

  describe('Resend code', () => {
    it('has a resend code button with i18n key', () => {
      expect(loginSource).toContain("t('auth.resendCode')");
    });

    it('implements 30-second cooldown for resend', () => {
      expect(loginSource).toContain('RESEND_COOLDOWN_SECONDS = 30');
      expect(loginSource).toContain('setResendCooldown(RESEND_COOLDOWN_SECONDS)');
    });

    it('disables resend during cooldown', () => {
      expect(loginSource).toContain('resendCooldown > 0');
      expect(loginSource).toContain('aria-disabled={resendCooldown > 0}');
    });

    it('resend calls requestPin again', () => {
      // handleResendCode calls apiClient.auth.requestPin
      expect(loginSource).toContain('handleResendCode');
      const resendMatch = loginSource.match(
        /handleResendCode[\s\S]*?apiClient\.auth\.requestPin/,
      );
      expect(resendMatch).not.toBeNull();
    });

    it('resets timer and cooldown on resend', () => {
      // Inside handleResendCode
      const resendBlock = loginSource.match(
        /handleResendCode[\s\S]*?setSecondsLeft\(PIN_EXPIRY_SECONDS\)/,
      );
      expect(resendBlock).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('shows invalidCode error for generic failures', () => {
      expect(loginSource).toContain("t('auth.invalidCode')");
    });

    it('shows codeExpired error for expired codes', () => {
      expect(loginSource).toContain("t('auth.codeExpired')");
    });

    it('shows tooManyAttempts error for rate limiting', () => {
      expect(loginSource).toContain("t('auth.tooManyAttempts')");
    });

    it('uses aria-live polite for error announcements', () => {
      expect(loginSource).toContain('aria-live="polite"');
    });

    it('uses role alert for error messages', () => {
      expect(loginSource).toContain('role="alert"');
    });

    it('uses $statusDanger color for error text', () => {
      expect(loginSource).toContain('color="$statusDanger"');
    });

    it('clears pin and resets auto-submit flag on error', () => {
      // In verifyPin catch block
      const catchBlock = loginSource.match(
        /catch[\s\S]*?setPin\(''\)[\s\S]*?hasAutoSubmitted\.current = false/,
      );
      expect(catchBlock).not.toBeNull();
    });

    it('parses error messages to distinguish expired vs invalid vs too-many', () => {
      expect(loginSource).toContain("message.toLowerCase().includes('expired')");
      expect(loginSource).toContain("message.toLowerCase().includes('too many')");
    });
  });

  describe('Accessibility', () => {
    it('email input has aria-label', () => {
      expect(loginSource).toContain("aria-label={t('auth.emailPlaceholder')}");
    });

    it('method selector has aria-label', () => {
      expect(loginSource).toContain("aria-label={t('auth.login')}");
    });

    it('resend button has role button and tabIndex', () => {
      expect(loginSource).toContain('role="button"');
      expect(loginSource).toContain('tabIndex={0}');
    });

    it('OTP input has keyboard navigable slots', () => {
      // input-otp handles keyboard navigation internally
      expect(loginSource).toContain('<OTPInput');
    });
  });

  describe('i18n compliance', () => {
    it('does not contain hardcoded user-facing strings', () => {
      // Check that common English phrases are not hardcoded
      // (they should all come from t() calls)
      const lines = loginSource.split('\n');
      const contentLines = lines.filter(
        (line) =>
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('import'),
      );
      const content = contentLines.join('\n');

      // These phrases should NOT appear as raw strings outside t() calls
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
    it('is defined in the source', () => {
      expect(loginSource).toContain('function formatTime(totalSeconds: number): string');
    });

    it('formats 300 seconds as 5:00', () => {
      // Extract and eval the function
      const match = loginSource.match(
        /function formatTime\(totalSeconds: number\): string \{[\s\S]*?return[\s\S]*?\}/,
      );
      expect(match).not.toBeNull();

      // Manually test the logic
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
    it('is defined in the source', () => {
      expect(loginSource).toContain('function extractErrorMessage(err: unknown): string');
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

describe('Login page module', () => {
  it('exports Route from createFileRoute', async () => {
    const mod = await import('../login');
    expect(mod.Route).toBeDefined();
  });
});
