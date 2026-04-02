import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

export function buildCorsOrigin(
  corsOriginEnv: string,
): (origin: string | undefined, callback: CorsOriginCallback) => void {
  const allowedOrigins = corsOriginEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: CorsOriginCallback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  };
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin: buildCorsOrigin(process.env.CORS_ORIGIN ?? ''),
    credentials: true,
  };
}
