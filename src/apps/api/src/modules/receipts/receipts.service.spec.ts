import { ReceiptsService } from './receipts.service';
import type {
  IReceiptVisionProvider,
  ReceiptImageMimeType,
} from './vision/receipt-vision.provider';

describe('ReceiptsService', () => {
  let provider: jest.Mocked<IReceiptVisionProvider>;
  let service: ReceiptsService;

  beforeEach(() => {
    provider = { extract: jest.fn() };
    service = new ReceiptsService(provider);
  });

  function fileFixture(
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File {
    return {
      buffer: Buffer.from('fake-image-bytes'),
      mimetype: 'image/jpeg',
      originalname: 'receipt.jpg',
      size: 16,
      ...overrides,
    } as Express.Multer.File;
  }

  it('forwards the buffer and mime type to the vision provider', async () => {
    const buffer = Buffer.from('jpeg-bytes-here');
    provider.extract.mockResolvedValue({ total: 1, date: '2026-01-01', merchant: 'X' });

    await service.extractFromUpload(fileFixture({ buffer, mimetype: 'image/jpeg' }));

    expect(provider.extract).toHaveBeenCalledTimes(1);
    expect(provider.extract).toHaveBeenCalledWith(buffer, 'image/jpeg' as ReceiptImageMimeType);
  });

  it('returns the provider result unchanged', async () => {
    const result = { total: 42.5, date: '2026-05-05', merchant: 'Café Central' };
    provider.extract.mockResolvedValue(result);

    const got = await service.extractFromUpload(fileFixture({ mimetype: 'image/png' }));

    expect(got).toEqual(result);
  });

  it('returns an all-null result unchanged when the model could not read the receipt', async () => {
    const result = { total: null, date: null, merchant: null };
    provider.extract.mockResolvedValue(result);

    const got = await service.extractFromUpload(fileFixture());

    expect(got).toEqual(result);
  });

  it('propagates provider errors so the global filter can map them to HTTP responses', async () => {
    const upstream = new Error('upstream timeout');
    provider.extract.mockRejectedValue(upstream);

    await expect(service.extractFromUpload(fileFixture())).rejects.toBe(upstream);
  });
});
