const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;
const OUTPUT_MIME = 'image/jpeg';

export async function prepareReceiptImage(file: File): Promise<Blob> {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('prepareReceiptImage: input is not an image file');
  }

  const url = URL.createObjectURL(file);
  let image: HTMLImageElement;
  try {
    image = await loadImage(url);
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('prepareReceiptImage: could not decode image');
  }
  URL.revokeObjectURL(url);

  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('prepareReceiptImage: 2d canvas context unavailable');
  }

  ctx.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('prepareReceiptImage: encoding to JPEG failed'));
          return;
        }
        resolve(blob);
      },
      OUTPUT_MIME,
      JPEG_QUALITY,
    );
  });
}

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    throw new Error('prepareReceiptImage: image has invalid dimensions');
  }
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const ratio = width >= height ? maxEdge / width : maxEdge / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('image decode failed')));
    img.src = url;
  });
}
