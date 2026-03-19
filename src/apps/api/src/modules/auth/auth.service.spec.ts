import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '@/modules/common/email/email.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { AuthService } from './auth.service'

const mockMagicLinkCreate = jest.fn()
const mockSendMagicLink = jest.fn()

const prismaServiceMock = {
  magicLink: {
    create: mockMagicLinkCreate,
  },
}

const emailServiceMock = {
  sendMagicLink: mockSendMagicLink,
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
})
