import { config as loadEnv } from 'dotenv'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'

describe('PrismaService (integration)', () => {
  let moduleRef: TestingModule | undefined
  let prisma: PrismaService | undefined

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true })
    loadEnv({ path: '.env', quiet: true })

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'integration-test-secret',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_integration_placeholder',
      PORT: process.env.PORT ?? '3000',
    }
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL must be set (or present in .env) for Prisma integration tests',
      )
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
      ],
    }).compile()

    await moduleRef.init()
    prisma = moduleRef.get(PrismaService)
  })

  afterAll(async () => {
    await moduleRef?.close()
  })

  it('runs a simple query against the database', async () => {
    if (!prisma) {
      throw new Error('PrismaService not initialized')
    }
    const rows = await prisma.$queryRaw<Array<{ one: number }>>`
      SELECT 1::int AS "one"
    `
    expect(rows[0]?.one).toBe(1)
  })
})
