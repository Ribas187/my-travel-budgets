import type { ConfigService } from '@nestjs/config';

import { createReceiptVisionProvider } from './receipts.module';
import { StubReceiptVisionProvider } from './vision/receipt-vision.stub';
import { OpenRouterReceiptVisionProvider } from './vision/receipt-vision.openrouter';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('createReceiptVisionProvider', () => {
  it('returns the stub provider when OPENROUTER_API_KEY is not set', () => {
    const provider = createReceiptVisionProvider(makeConfig({}));
    expect(provider).toBeInstanceOf(StubReceiptVisionProvider);
  });

  it('returns the stub provider when OPENROUTER_API_KEY is an empty string', () => {
    const provider = createReceiptVisionProvider(makeConfig({ OPENROUTER_API_KEY: '' }));
    expect(provider).toBeInstanceOf(StubReceiptVisionProvider);
  });

  it('returns the OpenRouter provider when OPENROUTER_API_KEY is set', () => {
    const provider = createReceiptVisionProvider(
      makeConfig({
        OPENROUTER_API_KEY: 'or-key',
        RECEIPT_VISION_MODEL: 'anthropic/claude-haiku-4-5',
      }),
    );
    expect(provider).toBeInstanceOf(OpenRouterReceiptVisionProvider);
  });

  it('returns the OpenRouter provider with the default model when RECEIPT_VISION_MODEL is unset', () => {
    const provider = createReceiptVisionProvider(makeConfig({ OPENROUTER_API_KEY: 'or-key' }));
    expect(provider).toBeInstanceOf(OpenRouterReceiptVisionProvider);
  });
});
