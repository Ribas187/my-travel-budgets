import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY!: string;

  @IsString()
  @IsNotEmpty()
  PORT!: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_URL!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  // Optional in dev/test (the receipts module falls back to a stub provider when missing).
  // Production deployments MUST set this to enable real receipt extraction.
  @IsOptional()
  @IsString()
  OPENROUTER_API_KEY?: string;

  // Optional. Defaults to `openai/gpt-4o-mini` at runtime when unset. Must be a model whose
  // OpenRouter adapter supports `response_format: { type: 'json_schema', strict: true }`.
  @IsOptional()
  @IsString()
  RECEIPT_VISION_MODEL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
    throw new Error(`Environment validation failed — missing or invalid: ${messages.join('; ')}`);
  }
  return validated;
}
