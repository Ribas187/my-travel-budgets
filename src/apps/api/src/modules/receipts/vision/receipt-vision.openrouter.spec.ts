import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import OpenAI from 'openai';

import {
  DEFAULT_RECEIPT_VISION_MODEL,
  OpenRouterReceiptVisionProvider,
} from './receipt-vision.openrouter';

type CreateFn = jest.Mock<Promise<unknown>, [unknown]>;

function makeFakeClient(create: CreateFn): OpenAI {
  return {
    chat: { completions: { create } },
  } as unknown as OpenAI;
}

function chatCompletion(content: string, usage = { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 }) {
  return {
    id: 'chatcmpl-1',
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
    usage,
  };
}

const VALID_RESPONSE = JSON.stringify({ total: 42.5, date: '2026-05-05', merchant: 'Café Central' });

describe('OpenRouterReceiptVisionProvider', () => {
  describe('constructor', () => {
    it('throws ServiceUnavailableException when the API key is missing', () => {
      expect(() => new OpenRouterReceiptVisionProvider({ apiKey: '' })).toThrow(
        ServiceUnavailableException,
      );
    });

    it('falls back to the default model when none is configured', () => {
      const create = jest.fn().mockResolvedValue(chatCompletion(VALID_RESPONSE));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });
      // Verifying via the request body in extract() below — model surfaces on the call.
      return provider.extract(Buffer.from('jpg'), 'image/jpeg').then(() => {
        expect((create.mock.calls[0]![0] as { model: string }).model).toBe(
          DEFAULT_RECEIPT_VISION_MODEL,
        );
      });
    });
  });

  describe('extract — request shape', () => {
    let create: CreateFn;
    let provider: OpenRouterReceiptVisionProvider;

    beforeEach(() => {
      create = jest.fn().mockResolvedValue(chatCompletion(VALID_RESPONSE));
      provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'test-key',
        model: 'anthropic/claude-haiku-4-5',
        client: makeFakeClient(create),
      });
    });

    it('uses the configured model and JSON-schema response format', async () => {
      await provider.extract(Buffer.from('img'), 'image/jpeg');

      const body = create.mock.calls[0]![0] as Record<string, unknown>;
      expect(body.model).toBe('anthropic/claude-haiku-4-5');
      expect(body.response_format).toMatchObject({
        type: 'json_schema',
        json_schema: { name: 'extracted_receipt', strict: true },
      });
    });

    it('embeds the image as a base64 data URL with the correct MIME type', async () => {
      const buffer = Buffer.from('jpeg-bytes');
      await provider.extract(buffer, 'image/jpeg');

      const body = create.mock.calls[0]![0] as { messages: Array<{ role: string; content: unknown }> };
      const userMessage = body.messages.find((m) => m.role === 'user')!;
      const parts = userMessage.content as Array<Record<string, unknown>>;
      const imagePart = parts.find((p) => p.type === 'image_url')!;
      const url = (imagePart.image_url as { url: string }).url;

      expect(url.startsWith('data:image/jpeg;base64,')).toBe(true);
      expect(url.slice('data:image/jpeg;base64,'.length)).toBe(buffer.toString('base64'));
    });

    it('also handles png images', async () => {
      await provider.extract(Buffer.from('png'), 'image/png');
      const body = create.mock.calls[0]![0] as { messages: Array<{ role: string; content: unknown }> };
      const userMessage = body.messages.find((m) => m.role === 'user')!;
      const parts = userMessage.content as Array<Record<string, unknown>>;
      const imagePart = parts.find((p) => p.type === 'image_url')!;
      expect((imagePart.image_url as { url: string }).url.startsWith('data:image/png;base64,')).toBe(
        true,
      );
    });

    it('includes a system prompt that mentions Brazilian nota fiscal coverage', async () => {
      await provider.extract(Buffer.from('x'), 'image/jpeg');
      const body = create.mock.calls[0]![0] as { messages: Array<{ role: string; content: string }> };
      const system = body.messages.find((m) => m.role === 'system')!;
      expect(system.content).toMatch(/nota fiscal/i);
      expect(system.content).toMatch(/null/);
    });
  });

  describe('extract — happy path', () => {
    it('returns the parsed receipt on a single successful call', async () => {
      const create = jest.fn().mockResolvedValue(chatCompletion(VALID_RESPONSE));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      const result = await provider.extract(Buffer.from('x'), 'image/jpeg');

      expect(result).toEqual({ total: 42.5, date: '2026-05-05', merchant: 'Café Central' });
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('accepts an all-null payload as a valid extraction', async () => {
      const allNull = JSON.stringify({ total: null, date: null, merchant: null });
      const create = jest.fn().mockResolvedValue(chatCompletion(allNull));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      expect(await provider.extract(Buffer.from('x'), 'image/jpeg')).toEqual({
        total: null,
        date: null,
        merchant: null,
      });
    });
  });

  describe('extract — retry-once on parse failure', () => {
    it('retries when the first response is malformed JSON and succeeds on the second', async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(chatCompletion('not-json-at-all'))
        .mockResolvedValueOnce(chatCompletion(VALID_RESPONSE));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      const result = await provider.extract(Buffer.from('x'), 'image/jpeg');

      expect(create).toHaveBeenCalledTimes(2);
      expect(result.merchant).toBe('Café Central');
    });

    it('retries when the first response violates the schema and succeeds on the second', async () => {
      const violating = JSON.stringify({ total: -1, date: 'yesterday', merchant: '' });
      const create = jest
        .fn()
        .mockResolvedValueOnce(chatCompletion(violating))
        .mockResolvedValueOnce(chatCompletion(VALID_RESPONSE));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      const result = await provider.extract(Buffer.from('x'), 'image/jpeg');

      expect(create).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(42.5);
    });

    it('throws UnprocessableEntityException when both attempts fail to parse', async () => {
      const create = jest.fn().mockResolvedValue(chatCompletion('still not json'));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      await expect(provider.extract(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(create).toHaveBeenCalledTimes(2);
    });

    it('throws UnprocessableEntityException when both attempts return schema-violating output', async () => {
      const violating = JSON.stringify({ total: 'free', date: 'never', merchant: 'x'.repeat(200) });
      const create = jest.fn().mockResolvedValue(chatCompletion(violating));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      await expect(provider.extract(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(create).toHaveBeenCalledTimes(2);
    });
  });

  describe('extract — upstream errors', () => {
    function makeApiError(status: number): InstanceType<typeof OpenAI.APIError> {
      const err = Object.create(OpenAI.APIError.prototype) as InstanceType<typeof OpenAI.APIError>;
      Object.assign(err, {
        status,
        message: `upstream ${status}`,
        name: 'APIError',
        headers: {},
      });
      return err;
    }

    it('maps an upstream 5xx APIError to BadGatewayException', async () => {
      const create = jest.fn().mockRejectedValue(makeApiError(500));
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      await expect(provider.extract(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('maps a connection/timeout APIError to BadGatewayException', async () => {
      const timeout = Object.create(OpenAI.APIError.prototype) as InstanceType<typeof OpenAI.APIError>;
      Object.assign(timeout, { status: undefined, message: 'timeout', name: 'APIConnectionTimeoutError' });
      const create = jest.fn().mockRejectedValue(timeout);
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      await expect(provider.extract(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rethrows non-APIError errors unchanged so unexpected bugs surface', async () => {
      const bug = new Error('something else broke');
      const create = jest.fn().mockRejectedValue(bug);
      const provider = new OpenRouterReceiptVisionProvider({
        apiKey: 'k',
        client: makeFakeClient(create),
      });

      await expect(provider.extract(Buffer.from('x'), 'image/jpeg')).rejects.toBe(bug);
    });
  });

  describe('logging', () => {
    it('debug-logs only structured metadata — never prompt text, image bytes, or extracted fields', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

      try {
        const create = jest.fn().mockResolvedValue(chatCompletion(VALID_RESPONSE));
        const provider = new OpenRouterReceiptVisionProvider({
          apiKey: 'secret-key-do-not-leak',
          model: 'openai/gpt-4o-mini',
          client: makeFakeClient(create),
        });

        const merchantBytes = 'Café Central';
        await provider.extract(Buffer.from('jpeg-bytes-totally-secret'), 'image/jpeg');

        const allLogPayloads = debugSpy.mock.calls.map((args) => JSON.stringify(args));
        const concatenated = allLogPayloads.join('\n');

        // Forbidden content: image bytes, secret API key, prompt text, extracted PII
        expect(concatenated).not.toContain('jpeg-bytes-totally-secret');
        expect(concatenated).not.toContain('secret-key-do-not-leak');
        expect(concatenated).not.toContain('nota fiscal');
        expect(concatenated).not.toContain(merchantBytes);
        expect(concatenated).not.toContain('42.5');

        // Allowed content: model + token usage
        expect(concatenated).toContain('openai/gpt-4o-mini');
        expect(concatenated).toMatch(/promptTokens/);
      } finally {
        debugSpy.mockRestore();
      }
    });
  });
});
