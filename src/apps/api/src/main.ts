import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './modules/common/filters';
import { DecimalSerializationInterceptor } from './modules/common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new DecimalSerializationInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
