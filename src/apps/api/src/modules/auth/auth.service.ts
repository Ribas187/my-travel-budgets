import { Injectable, Logger } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { EmailService } from '@/modules/common/email/email.service'
import { PrismaService } from '@/modules/prisma/prisma.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async requestMagicLink(input: { email: string }): Promise<void> {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await this.prisma.magicLink.create({
      data: { email: input.email, token, expiresAt },
    })

    try {
      await this.email.sendMagicLink(input.email, token)
    } catch (err) {
      this.logger.error('Failed to send magic link email', err)
    }
  }
}
