import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import type { INestApplication } from '@nestjs/common'

const mockRequestMagicLink = jest.fn()

describe('AuthController', () => {
  let app: INestApplication

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { requestMagicLink: mockRequestMagicLink } },
      ],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /auth/magic-link', () => {
    it('returns 202 Accepted for a valid email', async () => {
      mockRequestMagicLink.mockResolvedValue(undefined)

      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.ACCEPTED)
    })

    it('returns neutral message in body', async () => {
      mockRequestMagicLink.mockResolvedValue(undefined)

      const res = await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.ACCEPTED)

      expect(res.body).toEqual({
        message: 'If this email is registered, you will receive a magic link.',
      })
    })

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'not-an-email' })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
    })
  })
})
