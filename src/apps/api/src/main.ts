import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors';
import { AllExceptionsFilter } from './modules/common/filters';
import { DecimalSerializationInterceptor } from './modules/common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(buildCorsOptions());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new DecimalSerializationInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
