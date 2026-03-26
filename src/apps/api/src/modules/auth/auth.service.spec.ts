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
const mockJwtSign = jest.fn();

const authRepositoryMock = {
  createMagicLink: mockCreateMagicLink,
  findMagicLinkByToken: mockFindMagicLinkByToken,
  consumeMagicLink: mockConsumeMagicLink,
  upsertUserByEmail: mockUpsertUserByEmail,
};

const emailServiceMock = {
  sendMagicLink: mockSendMagicLink,
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
});
