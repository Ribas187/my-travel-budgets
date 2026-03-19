import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'node:crypto'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  private readonly resend: Resend

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'))
  }

  async sendMagicLink(email: string, token: string): Promise<void> {
    const baseUrl =
      this.config.get<string>('MAGIC_LINK_BASE_URL') ?? 'http://localhost:5173'
    const normalizedBase = baseUrl.replace(/\/$/, '')
    const verifyUrl = `${normalizedBase}/auth/verify?token=${encodeURIComponent(token)}`
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev'

    const idempotencyKey = createHash('sha256')
      .update(`magic-link:${email}:${token}`)
      .digest('hex')

    const { error } = await this.resend.emails.send(
      {
        from,
        to: email,
        subject: 'Your sign-in link',
        html: `<p>Sign in to My Travel Budgets:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      },
      { idempotencyKey },
    )

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }
  }
}
