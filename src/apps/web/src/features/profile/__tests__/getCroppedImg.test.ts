import { describe, it, expect, vi, beforeEach } from 'vitest';

// Since tests run in Node (no DOM), we mock the necessary browser globals
// before importing the module.

const mockDrawImage = vi.fn();
const mockToBlob = vi.fn();
let mockGetContext: ReturnType<typeof vi.fn>;

const mockCanvas = {
  width: 0,
  height: 0,
  get getContext() {
    return mockGetContext;
  },
  toBlob: mockToBlob,
};

// Set up global mocks before test execution
vi.stubGlobal('document', {
  createElement: vi.fn((tag: string) => {
    if (tag === 'canvas') return mockCanvas;
    return {};
  }),
});

vi.stubGlobal(
  'Image',
  class {
    crossOrigin = '';
    _src = '';
    private _loadHandlers: Array<() => void> = [];

    addEventListener(event: string, handler: () => void) {
      if (event === 'load') this._loadHandlers.push(handler);
    }

    setAttribute(key: string, value: string) {
      (this as Record<string, unknown>)[key] = value;
    }

    set src(value: string) {
      this._src = value;
      for (const handler of this._loadHandlers) handler();
    }

    get src() {
      return this._src;
    }
  },
);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContext = vi.fn(() => ({ drawImage: mockDrawImage }));
  mockCanvas.width = 0;
  mockCanvas.height = 0;
});

describe('getCroppedImg', () => {
  it('creates a canvas with the cropped area dimensions', async () => {
    const { getCroppedImg } = await import('../getCroppedImg');
    const croppedAreaPixels = { x: 10, y: 20, width: 200, height: 200 };
    const fakeBlob = new Blob(['test'], { type: 'image/jpeg' });

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(fakeBlob);
    });

    const result = await getCroppedImg('data:image/png;base64,test', croppedAreaPixels);

    expect(mockCanvas.width).toBe(200);
    expect(mockCanvas.height).toBe(200);
    expect(result).toBe(fakeBlob);
  });

  it('calls drawImage with correct source and destination coordinates', async () => {
    const { getCroppedImg } = await import('../getCroppedImg');
    const croppedAreaPixels = { x: 50, y: 100, width: 300, height: 300 };
    const fakeBlob = new Blob(['test'], { type: 'image/jpeg' });

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(fakeBlob);
    });

    await getCroppedImg('data:image/png;base64,test', croppedAreaPixels);

    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      50, 100,
      300, 300,
      0, 0,
      300, 300,
    );
  });

  it('produces a JPEG blob at 0.9 quality', async () => {
    const { getCroppedImg } = await import('../getCroppedImg');
    const croppedAreaPixels = { x: 0, y: 0, width: 100, height: 100 };
    const fakeBlob = new Blob(['test'], { type: 'image/jpeg' });

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void, type: string, quality: number) => {
      expect(type).toBe('image/jpeg');
      expect(quality).toBe(0.9);
      callback(fakeBlob);
    });

    const result = await getCroppedImg('data:image/png;base64,test', croppedAreaPixels);
    expect(result).toBeInstanceOf(Blob);
  });

  it('rejects when toBlob returns null', async () => {
    const { getCroppedImg } = await import('../getCroppedImg');
    const croppedAreaPixels = { x: 0, y: 0, width: 100, height: 100 };

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(null);
    });

    await expect(getCroppedImg('data:image/png;base64,test', croppedAreaPixels))
      .rejects.toThrow('Canvas toBlob returned null');
  });

  it('rejects when canvas context is unavailable', async () => {
    const { getCroppedImg } = await import('../getCroppedImg');
    const croppedAreaPixels = { x: 0, y: 0, width: 100, height: 100 };

    mockGetContext = vi.fn(() => null);

    await expect(getCroppedImg('data:image/png;base64,test', croppedAreaPixels))
      .rejects.toThrow('Could not get canvas context');
  });
});
