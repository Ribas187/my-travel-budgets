import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { prepareReceiptImage, fitWithin } from './prepareReceiptImage';

// ---------------------------------------------------------------------------
// DOM stubs
//
// vitest runs `apps/web` tests in the default `node` environment (per
// vite.config.ts). `prepareReceiptImage` uses browser APIs — `Image`,
// `document.createElement('canvas')`, `URL.createObjectURL/revokeObjectURL` —
// so we stub each one here. The mock canvas's `toBlob` returns a synthetic
// JPEG byte sequence that mirrors what a real browser canvas emits: a JFIF
// SOI marker, a generic JFIF APP0 segment, and an EOI marker — and crucially
// NO `0xFFE1 ... Exif\0\0` (APP1/EXIF) segment. That mirrors real browser
// behavior, where `canvas.toBlob('image/jpeg')` discards EXIF / XMP because
// the canvas only holds decoded pixels, not metadata.
// ---------------------------------------------------------------------------

interface MockImageController {
  width: number;
  height: number;
  shouldFail?: boolean;
}

let nextImageController: MockImageController = { width: 0, height: 0 };
let toBlobOverride: ((cb: (b: Blob | null) => void, mime: string) => void) | null = null;

class MockHTMLImageElement {
  naturalWidth = 0;
  naturalHeight = 0;
  width = 0;
  height = 0;
  src = '';
  private listeners = new Map<string, Array<() => void>>();

  addEventListener(type: string, cb: () => void) {
    const arr = this.listeners.get(type) ?? [];
    arr.push(cb);
    this.listeners.set(type, arr);
  }
  _fire(type: 'load' | 'error') {
    queueMicrotask(() => {
      this.listeners.get(type)?.forEach((cb) => cb());
    });
  }
}

class MockCanvasRenderingContext {
  drawImageCalls: unknown[][] = [];
  drawImage(...args: unknown[]) {
    this.drawImageCalls.push(args);
  }
}

class MockHTMLCanvasElement {
  width = 0;
  height = 0;
  ctx = new MockCanvasRenderingContext();
  getContext(_type: '2d') {
    return this.ctx;
  }
  toBlob(cb: (b: Blob | null) => void, mime = 'image/jpeg') {
    if (toBlobOverride) {
      toBlobOverride(cb, mime);
      return;
    }
    // Synthetic minimal JPEG body — JFIF SOI + APP0 + EOI, no APP1/EXIF.
    const bytes = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe0, // APP0
      0x00, 0x10,
      0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xd9, // EOI
    ]);
    cb(new Blob([bytes], { type: mime }));
  }
}

function installDomStubs() {
  // Image
  let lastImage: MockHTMLImageElement | null = null;
  const ImageCtor = function () {
    const img = new MockHTMLImageElement();
    lastImage = img;
    // Defer firing until `.src` setter runs after addEventListener calls.
    queueMicrotask(() => {
      if (nextImageController.shouldFail) {
        img._fire('error');
        return;
      }
      img.naturalWidth = nextImageController.width;
      img.naturalHeight = nextImageController.height;
      img._fire('load');
    });
    return img;
  } as unknown as { new (): MockHTMLImageElement };

  vi.stubGlobal('Image', ImageCtor);

  // document.createElement('canvas')
  const created: MockHTMLCanvasElement[] = [];
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        const c = new MockHTMLCanvasElement();
        created.push(c);
        return c;
      }
      throw new Error(`unexpected document.createElement(${tag})`);
    },
  });

  // URL
  const createObjectURL = vi.fn((_b: Blob) => 'blob:mock-url');
  const revokeObjectURL = vi.fn(() => undefined);
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

  return { createdCanvases: created, getLastImage: () => lastImage, createObjectURL, revokeObjectURL };
}

// EXIF/APP1 marker scanner — looks for 0xFFE1 followed by "Exif\0\0".
function containsExifMarker(bytes: Uint8Array): boolean {
  const exifAscii = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  for (let i = 0; i + 1 + exifAscii.length < bytes.length; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
      // APP1 segment found — check the immediate-after-length-field magic.
      const magicStart = i + 4;
      let match = true;
      for (let j = 0; j < exifAscii.length; j++) {
        if (bytes[magicStart + j] !== exifAscii[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('fitWithin', () => {
  it('returns the source size unchanged when both edges are within max', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1600, 1200, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('downscales a landscape image so its longest edge equals max', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('downscales a portrait image so its longest edge equals max', () => {
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('handles a square image at max edge', () => {
    expect(fitWithin(3200, 3200, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('rounds down to the nearest integer', () => {
    const out = fitWithin(3001, 1999, 1600);
    expect(out.width).toBe(1600);
    // 1999 * (1600/3001) ≈ 1065.7 → rounds to 1066
    expect(out.height).toBe(Math.round(1999 * (1600 / 3001)));
  });

  it('throws on invalid dimensions', () => {
    expect(() => fitWithin(0, 100, 1600)).toThrow();
    expect(() => fitWithin(100, -1, 1600)).toThrow();
  });
});

describe('prepareReceiptImage', () => {
  let stubs: ReturnType<typeof installDomStubs>;

  beforeEach(() => {
    nextImageController = { width: 0, height: 0 };
    toBlobOverride = null;
    stubs = installDomStubs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects when the input file is not an image', async () => {
    const txt = new File(['hello'], 'note.txt', { type: 'text/plain' });
    await expect(prepareReceiptImage(txt)).rejects.toThrow(/not an image/);
  });

  it('rejects with a descriptive error when the image cannot be decoded', async () => {
    nextImageController = { width: 0, height: 0, shouldFail: true };
    const file = new File([new Uint8Array([1, 2, 3])], 'corrupt.jpg', { type: 'image/jpeg' });

    await expect(prepareReceiptImage(file)).rejects.toThrow(/could not decode/i);
  });

  it('downscales a 4000x3000 landscape image to 1600x1200', async () => {
    nextImageController = { width: 4000, height: 3000 };
    const file = new File([new Uint8Array([1])], 'big.jpg', { type: 'image/jpeg' });

    await prepareReceiptImage(file);

    const canvas = stubs.createdCanvases[0]!;
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('downscales a 3000x4000 portrait image to 1200x1600', async () => {
    nextImageController = { width: 3000, height: 4000 };
    const file = new File([new Uint8Array([1])], 'big.jpg', { type: 'image/jpeg' });

    await prepareReceiptImage(file);

    const canvas = stubs.createdCanvases[0]!;
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(1600);
  });

  it('does not upscale a small image', async () => {
    nextImageController = { width: 800, height: 600 };
    const file = new File([new Uint8Array([1])], 'small.jpg', { type: 'image/jpeg' });

    await prepareReceiptImage(file);

    const canvas = stubs.createdCanvases[0]!;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('returns a Blob with type image/jpeg', async () => {
    nextImageController = { width: 1024, height: 768 };
    const file = new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' });

    const out = await prepareReceiptImage(file);

    expect(out).toBeInstanceOf(Blob);
    expect(out.type).toBe('image/jpeg');
  });

  it('produces a smaller payload than the (oversized) input', async () => {
    // Simulate a heavy 5 MB input. Our synthetic toBlob returns ~22 bytes,
    // which mirrors how a real browser canvas reduces an oversized photo.
    nextImageController = { width: 4000, height: 3000 };
    const heavyBytes = new Uint8Array(5 * 1024 * 1024);
    const file = new File([heavyBytes], 'big.jpg', { type: 'image/jpeg' });

    const out = await prepareReceiptImage(file);

    expect(out.size).toBeLessThan(file.size);
  });

  it('output bytes do not contain a JPEG APP1/EXIF marker', async () => {
    nextImageController = { width: 4000, height: 3000 };
    const file = new File([new Uint8Array([1])], 'photo.jpg', { type: 'image/jpeg' });

    const out = await prepareReceiptImage(file);
    const bytes = await blobToBytes(out);

    // Sanity: scanner correctly detects an EXIF marker in synthetic test bytes.
    expect(
      containsExifMarker(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9]),
      ),
    ).toBe(true);

    // Real assertion: no EXIF segment in the canvas-encoded output.
    expect(containsExifMarker(bytes)).toBe(false);
  });

  it('discards EXIF even when the input file carries an APP1/Exif segment', async () => {
    // Construct a "raw" input that pretends to be a JPEG with an EXIF block.
    const exifFlavored = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe1, 0x00, 0x12, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0,
      0xff, 0xd9,
    ]);
    expect(containsExifMarker(exifFlavored)).toBe(true);

    nextImageController = { width: 1200, height: 800 };
    const file = new File([exifFlavored], 'with-exif.jpg', { type: 'image/jpeg' });

    const out = await prepareReceiptImage(file);
    const outBytes = await blobToBytes(out);
    expect(containsExifMarker(outBytes)).toBe(false);
  });

  it('passes the decoded image into ctx.drawImage at the target size', async () => {
    nextImageController = { width: 4000, height: 3000 };
    const file = new File([new Uint8Array([1])], 'big.jpg', { type: 'image/jpeg' });

    await prepareReceiptImage(file);

    const canvas = stubs.createdCanvases[0]!;
    expect(canvas.ctx.drawImageCalls).toHaveLength(1);
    const args = canvas.ctx.drawImageCalls[0]!;
    // drawImage(image, 0, 0, width, height)
    expect(args[1]).toBe(0);
    expect(args[2]).toBe(0);
    expect(args[3]).toBe(1600);
    expect(args[4]).toBe(1200);
  });

  it('revokes the temporary object URL after decoding', async () => {
    nextImageController = { width: 1024, height: 768 };
    const file = new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' });

    await prepareReceiptImage(file);

    expect(stubs.createObjectURL).toHaveBeenCalledTimes(1);
    expect(stubs.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('rejects when toBlob returns null', async () => {
    nextImageController = { width: 1200, height: 800 };
    toBlobOverride = (cb) => cb(null);
    const file = new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' });

    await expect(prepareReceiptImage(file)).rejects.toThrow(/encoding to JPEG failed/);
  });
});
