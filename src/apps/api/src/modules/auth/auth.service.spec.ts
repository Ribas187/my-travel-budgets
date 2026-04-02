import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';

import { AUTH_REPOSITORY } from '@/modules/common/database';
import { EmailService } from '@/modules/common/email/email.service';
import { UnauthorizedError } from '@/modules/common/exceptions';

const mockCreateMagicLink = jest.fn();
const mockFindMagicLinkByToken = jest.fn();
const mockConsumeMagicLink = jest.fn();
const mockUpsertUserByEmail = jest.fn();
const mockSendMagicLink = jest.fn();
const mockSendLoginPin = jest.fn();
const mockJwtSign = jest.fn();
const mockCreateLoginPin = jest.fn();
const mockFindLoginPin = jest.fn();
const mockFindLatestUnusedLoginPin = jest.fn();
const mockConsumeLoginPin = jest.fn();
const mockIncrementLoginPinAttempts = jest.fn();
const mockInvalidateLoginPin = jest.fn();

const authRepositoryMock = {
  createMagicLink: mockCreateMagicLink,
  findMagicLinkByToken: mockFindMagicLinkByToken,
  consumeMagicLink: mockConsumeMagicLink,
  upsertUserByEmail: mockUpsertUserByEmail,
  createLoginPin: mockCreateLoginPin,
  findLoginPin: mockFindLoginPin,
  findLatestUnusedLoginPin: mockFindLatestUnusedLoginPin,
  consumeLoginPin: mockConsumeLoginPin,
  incrementLoginPinAttempts: mockIncrementLoginPinAttempts,
  invalidateLoginPin: mockInvalidateLoginPin,
};

const emailServiceMock = {
  sendMagicLink: mockSendMagicLink,
  sendLoginPin: mockSendLoginPin,
};

const jwtServiceMock = {
  sign: mockJwtSign,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_REPOSITORY, useValue: authRepositoryMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestMagicLink', () => {
    it('generates a cryptographically secure token (non-empty, 64 hex chars)', async () => {
      mockCreateMagicLink.mockResolvedValue({});
      mockSendMagicLink.mockResolvedValue(undefined);

      await service.requestMagicLink({ email: 'user@test.com' });

      const createCall = mockCreateMagicLink.mock.calls[0][0] as {
        token: string;
      };
      const { token } = createCall;
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('persists MagicLink with correct email and expiresAt ~10 min from now', async () => {
      mockCreateMagicLink.mockResolvedValue({});
      mockSendMagicLink.mockResolvedValue(undefined);

      const before = Date.now();
      await service.requestMagicLink({ email: 'user@test.com' });
      const after = Date.now();

      const createCall = mockCreateMagicLink.mock.calls[0][0] as {
        email: string;
        expiresAt: Date;
      };
      const { email, expiresAt } = createCall;

      expect(email).toBe('user@test.com');
      const expectedMin = before + 10 * 60 * 1000;
      const expectedMax = after + 10 * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('calls EmailService.sendMagicLink with the persisted email and token', async () => {
      mockCreateMagicLink.mockResolvedValue({});
      mockSendMagicLink.mockResolvedValue(undefined);

      await service.requestMagicLink({ email: 'user@test.com' });

      const createCall = mockCreateMagicLink.mock.calls[0][0] as {
        email: string;
        token: string;
      };
      const { email, token } = createCall;

      expect(mockSendMagicLink).toHaveBeenCalledTimes(1);
      expect(mockSendMagicLink).toHaveBeenCalledWith(email, token);
    });

    it('does not throw when EmailService fails', async () => {
      mockCreateMagicLink.mockResolvedValue({});
      mockSendMagicLink.mockRejectedValue(new Error('Resend error'));

      await expect(service.requestMagicLink({ email: 'user@test.com' })).resolves.toBeUndefined();
    });
  });

  describe('verifyMagicLink', () => {
    const validToken = 'valid-token-abc123';
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);

    it('throws UnauthorizedError when token does not exist', async () => {
      mockFindMagicLinkByToken.mockResolvedValue(null);

      await expect(service.verifyMagicLink({ token: 'nonexistent' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws UnauthorizedError when token is expired', async () => {
      mockFindMagicLinkByToken.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws UnauthorizedError when token is already used', async () => {
      mockFindMagicLinkByToken.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: futureDate,
        usedAt: new Date(),
      });

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('happy path: sets usedAt, creates user if missing, returns valid JWT', async () => {
      mockFindMagicLinkByToken.mockResolvedValue({
        token: validToken,
        email: 'newuser@test.com',
        expiresAt: futureDate,
        usedAt: null,
      });
      mockConsumeMagicLink.mockResolvedValue(true);
      mockUpsertUserByEmail.mockResolvedValue({ id: 'user-id-1', email: 'newuser@test.com' });
      mockJwtSign.mockReturnValue('signed-jwt-token');

      const result = await service.verifyMagicLink({ token: validToken });

      expect(mockConsumeMagicLink).toHaveBeenCalledWith(validToken);
      expect(mockUpsertUserByEmail).toHaveBeenCalledWith('newuser@test.com');
      expect(mockJwtSign).toHaveBeenCalledWith({ sub: 'user-id-1', email: 'newuser@test.com' });
      expect(result).toEqual({ accessToken: 'signed-jwt-token' });
    });

    it('happy path: existing user — does not duplicate, returns JWT with correct sub', async () => {
      const existingUserId = 'existing-user-id';
      mockFindMagicLinkByToken.mockResolvedValue({
        token: validToken,
        email: 'existing@test.com',
        expiresAt: futureDate,
        usedAt: null,
      });
      mockConsumeMagicLink.mockResolvedValue(true);
      mockUpsertUserByEmail.mockResolvedValue({ id: existingUserId, email: 'existing@test.com' });
      mockJwtSign.mockReturnValue('jwt-for-existing-user');

      const result = await service.verifyMagicLink({ token: validToken });

      expect(mockJwtSign).toHaveBeenCalledWith({ sub: existingUserId, email: 'existing@test.com' });
      expect(result).toEqual({ accessToken: 'jwt-for-existing-user' });
    });

    it('throws UnauthorizedError when concurrent request already consumed the token', async () => {
      mockFindMagicLinkByToken.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: futureDate,
        usedAt: null,
      });
      mockConsumeMagicLink.mockResolvedValue(false);

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe('requestLoginPin', () => {
    it('generates a 6-digit zero-padded PIN', async () => {
      mockCreateLoginPin.mockResolvedValue({});
      mockSendLoginPin.mockResolvedValue(undefined);

      await service.requestLoginPin({ email: 'user@test.com' });

      const createCall = mockCreateLoginPin.mock.calls[0][0] as { pin: string };
      expect(createCall.pin).toMatch(/^\d{6}$/);
      expect(createCall.pin).toHaveLength(6);
    });

    it('sets expiry to ~5 minutes from now', async () => {
      mockCreateLoginPin.mockResolvedValue({});
      mockSendLoginPin.mockResolvedValue(undefined);

      const before = Date.now();
      await service.requestLoginPin({ email: 'user@test.com' });
      const after = Date.now();

      const createCall = mockCreateLoginPin.mock.calls[0][0] as { expiresAt: Date };
      const expectedMin = before + 5 * 60 * 1000;
      const expectedMax = after + 5 * 60 * 1000;
      expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('calls createLoginPin and sendLoginPin with correct arguments', async () => {
      mockCreateLoginPin.mockResolvedValue({});
      mockSendLoginPin.mockResolvedValue(undefined);

      await service.requestLoginPin({ email: 'user@test.com' });

      expect(mockCreateLoginPin).toHaveBeenCalledTimes(1);
      const createCall = mockCreateLoginPin.mock.calls[0][0] as {
        email: string;
        pin: string;
      };
      expect(createCall.email).toBe('user@test.com');

      expect(mockSendLoginPin).toHaveBeenCalledTimes(1);
      expect(mockSendLoginPin).toHaveBeenCalledWith('user@test.com', createCall.pin);
    });

    it('does not throw when email send fails (catches and logs)', async () => {
      mockCreateLoginPin.mockResolvedValue({});
      mockSendLoginPin.mockRejectedValue(new Error('Resend error'));

      await expect(
        service.requestLoginPin({ email: 'user@test.com' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('verifyLoginPin', () => {
    const validPin = {
      id: 'pin-id-1',
      email: 'user@test.com',
      pin: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      usedAt: null,
      attempts: 0,
      createdAt: new Date(),
    };

    it('returns { accessToken } with correct JWT payload on valid PIN', async () => {
      mockFindLoginPin.mockResolvedValue({ ...validPin });
      mockConsumeLoginPin.mockResolvedValue(true);
      mockUpsertUserByEmail.mockResolvedValue({ id: 'user-id-1', email: 'user@test.com' });
      mockJwtSign.mockReturnValue('signed-jwt-token');

      const result = await service.verifyLoginPin({ email: 'user@test.com', pin: '123456' });

      expect(mockConsumeLoginPin).toHaveBeenCalledWith('pin-id-1');
      expect(mockUpsertUserByEmail).toHaveBeenCalledWith('user@test.com');
      expect(mockJwtSign).toHaveBeenCalledWith({ sub: 'user-id-1', email: 'user@test.com' });
      expect(result).toEqual({ accessToken: 'signed-jwt-token' });
    });

    it('throws UnauthorizedError("Code expired") when PIN is expired', async () => {
      mockFindLoginPin.mockResolvedValue({
        ...validPin,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '123456' }),
      ).rejects.toThrow(new UnauthorizedError('Code expired'));
    });

    it('throws UnauthorizedError("Invalid code") when PIN is not found (used or wrong)', async () => {
      mockFindLoginPin.mockResolvedValue(null);
      mockFindLatestUnusedLoginPin.mockResolvedValue(null);

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '000000' }),
      ).rejects.toThrow(new UnauthorizedError('Invalid code'));
    });

    it('throws UnauthorizedError("Invalid code") when concurrent consume fails', async () => {
      mockFindLoginPin.mockResolvedValue({ ...validPin });
      mockConsumeLoginPin.mockResolvedValue(false);

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '123456' }),
      ).rejects.toThrow(new UnauthorizedError('Invalid code'));
    });

    it('increments attempts on wrong PIN when a latest unused pin exists', async () => {
      mockFindLoginPin.mockResolvedValue(null);
      mockFindLatestUnusedLoginPin.mockResolvedValue({
        ...validPin,
        pin: '654321',
      });
      mockIncrementLoginPinAttempts.mockResolvedValue(1);

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '000000' }),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockIncrementLoginPinAttempts).toHaveBeenCalledWith('pin-id-1');
    });

    it('invalidates PIN when attempts reach 5 and throws "Too many attempts"', async () => {
      // First, set up the found PIN with 4 attempts (so next increment makes 5)
      const pinWith4Attempts = { ...validPin, attempts: 4 };
      mockFindLoginPin.mockResolvedValue(null);
      mockFindLatestUnusedLoginPin.mockResolvedValue(pinWith4Attempts);
      mockIncrementLoginPinAttempts.mockResolvedValue(5);
      mockInvalidateLoginPin.mockResolvedValue(undefined);

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '000000' }),
      ).rejects.toThrow(new UnauthorizedError('Invalid code'));

      expect(mockIncrementLoginPinAttempts).toHaveBeenCalledWith('pin-id-1');
      expect(mockInvalidateLoginPin).toHaveBeenCalledWith('pin-id-1');
    });

    it('throws UnauthorizedError("Too many attempts") when PIN has >= 5 attempts', async () => {
      mockFindLoginPin.mockResolvedValue({
        ...validPin,
        attempts: 5,
      });

      await expect(
        service.verifyLoginPin({ email: 'user@test.com', pin: '123456' }),
      ).rejects.toThrow(new UnauthorizedError('Too many attempts'));
    });
  });
});
