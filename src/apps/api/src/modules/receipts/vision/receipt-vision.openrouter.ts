import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import OpenAI from 'openai';
import {
  extractedReceiptJsonSchema,
  extractedReceiptSchema,
  type ExtractedReceipt,
} from '@repo/core';

import type {
  IReceiptVisionProvider,
  ReceiptImageMimeType,
} from './receipt-vision.provider';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_RECEIPT_VISION_MODEL = 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = [
  'You extract three fields from a single image of a paper or thermal receipt:',
  '- "total": the total amount paid in the receipt\'s currency, as a positive number with no currency symbol.',
  '- "date": the purchase date as ISO yyyy-MM-dd.',
  '- "merchant": the merchant or store name as printed (1-120 characters).',
  '',
  'Return null for any field you cannot read with confidence — never guess.',
  'The image may be a Brazilian "nota fiscal" / "cupom fiscal", a restaurant or hotel receipt,',
  'or a generic international receipt in any language. Decimal separators may be "." or ",".',
  'Output only the JSON object specified by the schema.',
].join('\n');

const USER_PROMPT = 'Extract the receipt fields from the image. Be careful with the date field, it can be mm/dd/yyyy when the language is English or dd/mm/yyyy when the language is Portuguese.';

const MAX_PARSE_ATTEMPTS = 2;

export interface OpenRouterReceiptVisionProviderOptions {
  apiKey: string;
  model?: string;
  /** Pre-built OpenAI client; primarily for tests. */
  client?: OpenAI;
}

export class OpenRouterReceiptVisionProvider implements IReceiptVisionProvider {
  private readonly logger = new Logger(OpenRouterReceiptVisionProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenRouterReceiptVisionProviderOptions) {
    if (!options.apiKey) {
      throw new ServiceUnavailableException(
        'Receipt vision provider is not configured (OPENROUTER_API_KEY missing).',
      );
    }
    this.model = options.model && options.model.length > 0 ? options.model : DEFAULT_RECEIPT_VISION_MODEL;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': 'https://mybudget.cards',
          'X-Title': 'My Travel Budgets',
        },
      });
  }

  async extract(image: Buffer, mimeType: ReceiptImageMimeType): Promise<ExtractedReceipt> {
    const dataUrl = `data:${mimeType};base64,${image.toString('base64')}`;
    const requestBody: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_receipt',
          strict: true,
          schema: extractedReceiptJsonSchema as unknown as Record<string, unknown>,
        },
      },
    };

    let lastParseFailure: string | null = null;

    for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
      const startedAt = Date.now();
      let response: OpenAI.Chat.Completions.ChatCompletion;
      try {
        response = await this.client.chat.completions.create(requestBody);
      } catch (err) {
        const latencyMs = Date.now() - startedAt;
        if (err instanceof OpenAI.APIError) {
          this.logger.debug({
            event: 'receipt_extraction_upstream_error',
            model: this.model,
            latencyMs,
            status: err.status ?? null,
            attempt,
          });
          throw new BadGatewayException('Receipt extraction upstream call failed.');
        }
        throw err;
      }

      const latencyMs = Date.now() - startedAt;
      this.logger.debug({
        event: 'receipt_extraction_response',
        model: this.model,
        latencyMs,
        status: 200,
        attempt,
        promptTokens: response.usage?.prompt_tokens ?? null,
        completionTokens: response.usage?.completion_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        lastParseFailure = 'empty_content';
        continue;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(content);
      } catch {
        lastParseFailure = 'invalid_json';
        continue;
      }

      const parsed = extractedReceiptSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data;
      }
      lastParseFailure = 'schema_violation';
    }

    this.logger.debug({
      event: 'receipt_extraction_unprocessable',
      model: this.model,
      reason: lastParseFailure,
    });
    throw new UnprocessableEntityException('Receipt content could not be extracted.');
  }
}
