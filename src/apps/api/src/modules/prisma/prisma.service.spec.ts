import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('calls $connect on module init and $disconnect on module destroy', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              key === 'DATABASE_URL'
                ? 'postgresql://localhost:5432/prisma_service_spec'
                : undefined,
          },
        },
      ],
    }).compile();
    const service = moduleRef.get(PrismaService);
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
  });
});
