import { plainToInstance } from 'class-transformer'
import { IsNotEmpty, IsString, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN!: string

  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY!: string

  @IsString()
  @IsNotEmpty()
  PORT!: string
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validated, { skipMissingProperties: false })
  if (errors.length > 0) {
    const messages = errors.flatMap((e) =>
      e.constraints ? Object.values(e.constraints) : [],
    )
    throw new Error(
      `Environment validation failed — missing or invalid: ${messages.join('; ')}`,
    )
  }
  return validated
}
