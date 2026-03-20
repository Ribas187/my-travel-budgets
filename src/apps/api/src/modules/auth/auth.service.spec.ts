import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '@/modules/common/email/email.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { AuthService } from './auth.service'

const mockMagicLinkCreate = jest.fn()
const mockMagicLinkFindUnique = jest.fn()
const mockMagicLinkUpdateMany = jest.fn()
const mockUserUpsert = jest.fn()
const mockSendMagicLink = jest.fn()
const mockJwtSign = jest.fn()

const prismaServiceMock = {
  magicLink: {
    create: mockMagicLinkCreate,
    findUnique: mockMagicLinkFindUnique,
    updateMany: mockMagicLinkUpdateMany,
  },
  user: {
    upsert: mockUserUpsert,
  },
}

const emailServiceMock = {
  sendMagicLink: mockSendMagicLink,
}

const jwtServiceMock = {
  sign: mockJwtSign,
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('requestMagicLink', () => {
    it('generates a cryptographically secure token (non-empty, 64 hex chars)', async () => {
      mockMagicLinkCreate.mockResolvedValue({})
      mockSendMagicLink.mockResolvedValue(undefined)

      await service.requestMagicLink({ email: 'user@test.com' })

      const createCall = mockMagicLinkCreate.mock.calls[0][0] as {
        data: { token: string }
      }
      const { token } = createCall.data
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('persists MagicLink with correct email and expiresAt ~10 min from now', async () => {
      mockMagicLinkCreate.mockResolvedValue({})
      mockSendMagicLink.mockResolvedValue(undefined)

      const before = Date.now()
      await service.requestMagicLink({ email: 'user@test.com' })
      const after = Date.now()

      const createCall = mockMagicLinkCreate.mock.calls[0][0] as {
        data: { email: string; expiresAt: Date }
      }
      const { email, expiresAt } = createCall.data

      expect(email).toBe('user@test.com')
      const expectedMin = before + 10 * 60 * 1000
      const expectedMax = after + 10 * 60 * 1000
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin)
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax)
    })

    it('calls EmailService.sendMagicLink with the persisted email and token', async () => {
      mockMagicLinkCreate.mockResolvedValue({})
      mockSendMagicLink.mockResolvedValue(undefined)

      await service.requestMagicLink({ email: 'user@test.com' })

      const createCall = mockMagicLinkCreate.mock.calls[0][0] as {
        data: { email: string; token: string }
      }
      const { email, token } = createCall.data

      expect(mockSendMagicLink).toHaveBeenCalledTimes(1)
      expect(mockSendMagicLink).toHaveBeenCalledWith(email, token)
    })

    it('does not throw when EmailService fails', async () => {
      mockMagicLinkCreate.mockResolvedValue({})
      mockSendMagicLink.mockRejectedValue(new Error('Resend error'))

      await expect(
        service.requestMagicLink({ email: 'user@test.com' }),
      ).resolves.toBeUndefined()
    })
  })

  describe('verifyMagicLink', () => {
    const validToken = 'valid-token-abc123'
    const futureDate = new Date(Date.now() + 10 * 60 * 1000)

    it('throws UnauthorizedException when token does not exist', async () => {
      mockMagicLinkFindUnique.mockResolvedValue(null)

      await expect(service.verifyMagicLink({ token: 'nonexistent' })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when token is expired', async () => {
      mockMagicLinkFindUnique.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      })

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when token is already used', async () => {
      mockMagicLinkFindUnique.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: futureDate,
        usedAt: new Date(),
      })

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('happy path: sets usedAt, creates user if missing, returns valid JWT', async () => {
      mockMagicLinkFindUnique.mockResolvedValue({
        token: validToken,
        email: 'newuser@test.com',
        expiresAt: futureDate,
        usedAt: null,
      })
      mockMagicLinkUpdateMany.mockResolvedValue({ count: 1 })
      mockUserUpsert.mockResolvedValue({ id: 'user-id-1', email: 'newuser@test.com' })
      mockJwtSign.mockReturnValue('signed-jwt-token')

      const result = await service.verifyMagicLink({ token: validToken })

      expect(mockMagicLinkUpdateMany).toHaveBeenCalledWith({
        where: { token: validToken, usedAt: null },
        data: { usedAt: expect.any(Date) },
      })
      expect(mockUserUpsert).toHaveBeenCalledWith({
        where: { email: 'newuser@test.com' },
        create: { email: 'newuser@test.com', name: '' },
        update: {},
      })
      expect(mockJwtSign).toHaveBeenCalledWith({ sub: 'user-id-1', email: 'newuser@test.com' })
      expect(result).toEqual({ accessToken: 'signed-jwt-token' })
    })

    it('happy path: existing user — does not duplicate, returns JWT with correct sub', async () => {
      const existingUserId = 'existing-user-id'
      mockMagicLinkFindUnique.mockResolvedValue({
        token: validToken,
        email: 'existing@test.com',
        expiresAt: futureDate,
        usedAt: null,
      })
      mockMagicLinkUpdateMany.mockResolvedValue({ count: 1 })
      mockUserUpsert.mockResolvedValue({ id: existingUserId, email: 'existing@test.com' })
      mockJwtSign.mockReturnValue('jwt-for-existing-user')

      const result = await service.verifyMagicLink({ token: validToken })

      expect(mockJwtSign).toHaveBeenCalledWith({ sub: existingUserId, email: 'existing@test.com' })
      expect(result).toEqual({ accessToken: 'jwt-for-existing-user' })
    })

    it('throws UnauthorizedException when concurrent request already consumed the token', async () => {
      mockMagicLinkFindUnique.mockResolvedValue({
        token: validToken,
        email: 'user@test.com',
        expiresAt: futureDate,
        usedAt: null,
      })
      mockMagicLinkUpdateMany.mockResolvedValue({ count: 0 })

      await expect(service.verifyMagicLink({ token: validToken })).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
