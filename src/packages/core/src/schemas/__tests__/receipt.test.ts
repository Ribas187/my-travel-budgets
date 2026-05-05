import { describe, it, expect } from 'vitest';

import { extractedReceiptSchema, extractedReceiptJsonSchema } from '../receipt';

type JsonSchemaProp = { type: readonly string[] };
type JsonSchema = {
  type: 'object';
  additionalProperties: false;
  required: readonly string[];
  properties: Readonly<Record<string, JsonSchemaProp>>;
};

function matchesJsonSchema(value: unknown, schema: JsonSchema): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  for (const key of schema.required) {
    if (!(key in obj)) return false;
  }
  for (const key of Object.keys(obj)) {
    if (!(key in schema.properties)) return false;
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    const v = obj[key];
    const ok = prop.type.some((t) => {
      if (t === 'null') return v === null;
      if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
      if (t === 'string') return typeof v === 'string';
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

const schema = extractedReceiptJsonSchema as unknown as JsonSchema;

describe('extractedReceiptSchema', () => {
  it('validates a fully-populated receipt', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 42.5,
      date: '2026-05-05',
      merchant: 'Café Central',
    });
    expect(result.success).toBe(true);
  });

  it('validates an all-null receipt (model could not read any field)', () => {
    const result = extractedReceiptSchema.safeParse({
      total: null,
      date: null,
      merchant: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero total', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 0,
      date: '2026-05-05',
      merchant: 'Shop',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative total', () => {
    const result = extractedReceiptSchema.safeParse({
      total: -1.5,
      date: '2026-05-05',
      merchant: 'Shop',
    });
    expect(result.success).toBe(false);
  });

  it('rejects NaN total', () => {
    const result = extractedReceiptSchema.safeParse({
      total: Number.NaN,
      date: '2026-05-05',
      merchant: 'Shop',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO date', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 10,
      date: '05/05/2026',
      merchant: 'Shop',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed date string', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 10,
      date: '2026-13-40',
      merchant: 'Shop',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty merchant', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 10,
      date: '2026-05-05',
      merchant: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects merchant longer than 120 chars', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 10,
      date: '2026-05-05',
      merchant: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('rejects payload missing a required key', () => {
    const result = extractedReceiptSchema.safeParse({
      total: 10,
      date: '2026-05-05',
    });
    expect(result.success).toBe(false);
  });
});

describe('extractedReceiptJsonSchema', () => {
  it('declares the same required fields as the Zod schema', () => {
    expect([...schema.required].sort()).toEqual(['date', 'merchant', 'total']);
  });

  it('forbids additional properties (OpenAI strict mode requirement)', () => {
    expect(schema.additionalProperties).toBe(false);
  });

  it('lists every property in required (OpenAI strict mode requirement)', () => {
    expect(Object.keys(schema.properties).sort()).toEqual([...schema.required].sort());
  });

  it('marks each property as nullable', () => {
    for (const prop of Object.values(schema.properties)) {
      expect(prop.type).toContain('null');
    }
  });

  it.each<{ label: string; value: unknown }>([
    { label: 'fully populated', value: { total: 42.5, date: '2026-05-05', merchant: 'Shop' } },
    { label: 'all null', value: { total: null, date: null, merchant: null } },
    { label: 'mixed', value: { total: 10, date: null, merchant: 'Shop' } },
  ])('every Zod-valid object also satisfies the JSON schema ($label)', ({ value }) => {
    expect(extractedReceiptSchema.safeParse(value).success).toBe(true);
    expect(matchesJsonSchema(value, schema)).toBe(true);
  });

  it.each<{ label: string; value: unknown }>([
    { label: 'extra field', value: { total: 10, date: '2026-05-05', merchant: 'X', extra: 1 } },
    { label: 'missing field', value: { total: 10, date: '2026-05-05' } },
    { label: 'wrong type', value: { total: '10', date: '2026-05-05', merchant: 'X' } },
  ])('rejects shape violations ($label)', ({ value }) => {
    expect(matchesJsonSchema(value, schema)).toBe(false);
  });
});
