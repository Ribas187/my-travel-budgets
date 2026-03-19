import { Test } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { EmailService } from './email.service'

const sendMock = jest.fn().mockResolvedValue({ data: { id: 're_test' }, error: null })

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}))

describe('EmailService', () => {
  const envKeys = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'RESEND_API_KEY',
    'PORT',
    'MAGIC_LINK_BASE_URL',
    'RESEND_FROM_EMAIL',
  ] as const
  const saved: Partial<Record<(typeof envKeys)[number], string | undefined>> =
    {}

  beforeEach(() => {
    sendMock.mockClear()
    for (const key of envKeys) {
      saved[key] = process.env[key]
    }
    Object.assign(process.env, {
      DATABASE_URL: 'postgresql://localhost:5432/t',
      JWT_SECRET: 'x',
      JWT_EXPIRES_IN: '30d',
      RESEND_API_KEY: 're_key',
      PORT: '3000',
      MAGIC_LINK_BASE_URL: 'https://app.test',
      RESEND_FROM_EMAIL: 'auth@test.com',
    })
  })

  afterEach(() => {
    for (const key of envKeys) {
      const v = saved[key]
      if (v === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = v
      }
    }
  })

  it('sendMagicLink calls Resend with expected payload and idempotency key', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          validate: validateEnv,
        }),
      ],
      providers: [EmailService],
    }).compile()

    const service = moduleRef.get(EmailService)
    await service.sendMagicLink('user@test.com', 'tok_abc')

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [payload, options] = sendMock.mock.calls[0] as [
      { from: string; to: string; subject: string; html: string },
      { idempotencyKey: string },
    ]
    expect(payload.from).toBe('auth@test.com')
    expect(payload.to).toBe('user@test.com')
    expect(payload.subject).toBe('Your sign-in link')
    expect(payload.html).toContain(
      `https://app.test/auth/verify?token=${encodeURIComponent('tok_abc')}`,
    )
    expect(options.idempotencyKey).toMatch(/^[a-f0-9]{64}$/)
  })
})
