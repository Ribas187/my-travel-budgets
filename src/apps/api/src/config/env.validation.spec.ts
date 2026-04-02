import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('throws when required variables are missing', () => {
    expect(() => validateEnv({})).toThrow(/Environment validation failed/);
  });

  it('accepts all required variables', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://localhost:5432/x',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '30d',
      RESEND_API_KEY: 're_test',
      CLOUDINARY_URL: 'cloudinary://key:secret@cloud',
      PORT: '3000',
      CORS_ORIGIN: 'https://mybudget.cards',
    });
    expect(env.PORT).toBe('3000');
    expect(env.JWT_EXPIRES_IN).toBe('30d');
    expect(env.CORS_ORIGIN).toBe('https://mybudget.cards');
  });

  it('throws when CORS_ORIGIN is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://localhost:5432/x',
        JWT_SECRET: 'secret',
        JWT_EXPIRES_IN: '30d',
        RESEND_API_KEY: 're_test',
        CLOUDINARY_URL: 'cloudinary://key:secret@cloud',
        PORT: '3000',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('rejects Nest ConfigModule bootstrap when required env vars are missing', async () => {
    const keys = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'RESEND_API_KEY',
      'CLOUDINARY_URL',
      'PORT',
      'CORS_ORIGIN',
    ] as const;
    const backup: Partial<Record<(typeof keys)[number], string | undefined>> = {};
    for (const key of keys) {
      backup[key] = process.env[key];
      delete process.env[key];
    }

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            ignoreEnvFile: true,
            validate: validateEnv,
          }),
        ],
      }).compile(),
    ).rejects.toThrow(/Environment validation failed/);

    for (const key of keys) {
      const v = backup[key];
      if (v !== undefined) {
        process.env[key] = v;
      }
    }
  });
});
