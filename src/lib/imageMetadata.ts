export interface WallpaperMetadata {
  size?: string;
  dimensions?: string;
}

export interface UploadedWallpaperItem {
  url: string;
  metadata?: WallpaperMetadata;
}

const IMAGE_DIMENSION_TIMEOUT_MS = 12000;
const CLOUDFRONT_TO_S3_DOMAIN = [
  ['https://d1wqpnbk3wcub7.cloudfront.net/', 'https://wallpaperassets.s3.us-east-1.amazonaws.com/'],
];

export const formatBytes = (bytes?: number): string | undefined => {
  if (!Number.isFinite(bytes) || bytes === undefined || bytes < 0) {
    return undefined;
  }

  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  const rounded = unitIndex === 0 ? value.toFixed(0) : value.toFixed(value >= 10 ? 1 : 2);

  return `${rounded} ${units[unitIndex]}`;
};

const uniq = <T,>(items: T[]): T[] => Array.from(new Set(items.filter(Boolean)));

const stripCloudFrontFitIn = (url: string): string => {
  return url.replace(/\/fit-in\/\d+x\d+\//, '/');
};

const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}metadata=${Date.now()}`;
};

const getUrlCandidates = (url: string): string[] => {
  const strippedUrl = stripCloudFrontFitIn(url);
  const s3Candidates = CLOUDFRONT_TO_S3_DOMAIN.flatMap(([cloudFront, s3]) => {
    return [url, strippedUrl]
      .filter(candidate => candidate.startsWith(cloudFront))
      .map(candidate => candidate.replace(cloudFront, s3));
  });

  return uniq([
    strippedUrl,
    url,
    addCacheBuster(strippedUrl),
    addCacheBuster(url),
    ...s3Candidates,
  ]);
};

const getImageDimensions = (src: string): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (dimensions?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(dimensions);
    };

    const timeout = window.setTimeout(() => {
      finish(undefined);
    }, IMAGE_DIMENSION_TIMEOUT_MS);

    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        finish(`${image.naturalWidth}x${image.naturalHeight}`);
      } else {
        finish(undefined);
      }
    };

    image.onerror = () => finish(undefined);
    image.src = src;
  });
};

const getImageDimensionsFromBlob = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) return undefined;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      return await getImageDimensions(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.warn('Unable to read image dimensions from blob:', error);
    return undefined;
  }
};

const parsePngDimensions = (view: DataView): string | undefined => {
  const isPng = view.byteLength >= 24
    && view.getUint32(0) === 0x89504e47
    && view.getUint32(4) === 0x0d0a1a0a;

  if (!isPng) return undefined;

  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? `${width}x${height}` : undefined;
};

const parseJpegDimensions = (view: DataView): string | undefined => {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return undefined;

  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);

    if (length < 2) return undefined;

    const isStartOfFrame = (
      marker >= 0xc0 && marker <= 0xcf
      && marker !== 0xc4
      && marker !== 0xc8
      && marker !== 0xcc
    );

    if (isStartOfFrame) {
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      return width > 0 && height > 0 ? `${width}x${height}` : undefined;
    }

    offset += 2 + length;
  }

  return undefined;
};

const parseWebpDimensions = (view: DataView): string | undefined => {
  if (
    view.byteLength < 30
    || view.getUint32(0, false) !== 0x52494646
    || view.getUint32(8, false) !== 0x57454250
  ) {
    return undefined;
  }

  const chunk = String.fromCharCode(
    view.getUint8(12),
    view.getUint8(13),
    view.getUint8(14),
    view.getUint8(15)
  );

  if (chunk === 'VP8X' && view.byteLength >= 30) {
    const width = 1 + view.getUint8(24) + (view.getUint8(25) << 8) + (view.getUint8(26) << 16);
    const height = 1 + view.getUint8(27) + (view.getUint8(28) << 8) + (view.getUint8(29) << 16);
    return `${width}x${height}`;
  }

  if (chunk === 'VP8 ' && view.byteLength >= 30) {
    const width = view.getUint16(26, true) & 0x3fff;
    const height = view.getUint16(28, true) & 0x3fff;
    return width > 0 && height > 0 ? `${width}x${height}` : undefined;
  }

  if (chunk === 'VP8L' && view.byteLength >= 25) {
    const b0 = view.getUint8(21);
    const b1 = view.getUint8(22);
    const b2 = view.getUint8(23);
    const b3 = view.getUint8(24);
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + ((b3 << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return `${width}x${height}`;
  }

  return undefined;
};

const parseImageDimensionsFromArrayBuffer = (buffer: ArrayBuffer): string | undefined => {
  const view = new DataView(buffer);
  return parsePngDimensions(view) || parseJpegDimensions(view) || parseWebpDimensions(view);
};

const buildWallpaperMetadataFromBytes = async (url: string): Promise<WallpaperMetadata | undefined> => {
  for (const candidate of getUrlCandidates(url)) {
    try {
      const response = await fetch(candidate, { cache: 'no-cache' });
      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      const dimensions = parseImageDimensionsFromArrayBuffer(buffer);

      if (!dimensions) continue;

      return {
        size: formatBytes(buffer.byteLength),
        dimensions,
      };
    } catch (error) {
      console.warn('Unable to read image metadata from bytes:', error);
    }
  }

  return undefined;
};

export const getImageDimensionsFromFile = async (file: File): Promise<string | undefined> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await getImageDimensions(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const getImageDimensionsFromUrl = async (url: string): Promise<string | undefined> => {
  if (!url) return undefined;

  const candidates = getUrlCandidates(url);

  for (const candidate of candidates) {
    const dimensions = await getImageDimensions(candidate);
    if (dimensions) return dimensions;
  }

  for (const candidate of candidates) {
    const dimensions = await getImageDimensionsFromBlob(candidate);
    if (dimensions) return dimensions;
  }

  return undefined;
};

export const getImageSizeFromUrl = async (url: string): Promise<string | undefined> => {
  if (!url) return undefined;

  for (const candidate of getUrlCandidates(url)) {
    try {
      const response = await fetch(candidate, { method: 'HEAD' });
      if (!response.ok) continue;

      const contentLength = response.headers.get('content-length');
      if (!contentLength) continue;

      const bytes = Number(contentLength);
      return formatBytes(bytes);
    } catch (error) {
      console.warn('Unable to read image size from URL:', error);
    }
  }

  return undefined;
};

const buildWallpaperMetadataFromOriginalUrl = async (url: string): Promise<WallpaperMetadata | undefined> => {
  const originalUrl = stripCloudFrontFitIn(url);
  const [size, byteMetadata] = await Promise.all([
    getImageSizeFromUrl(originalUrl),
    buildWallpaperMetadataFromBytes(originalUrl),
  ]);

  if (!size && !byteMetadata?.dimensions) {
    return undefined;
  }

  return {
    size: size || byteMetadata?.size,
    dimensions: byteMetadata?.dimensions,
  };
};

export const buildWallpaperMetadataFromFile = async (file: File): Promise<WallpaperMetadata> => {
  const [dimensions] = await Promise.all([
    getImageDimensionsFromFile(file),
  ]);

  return {
    size: formatBytes(file.size),
    dimensions,
  };
};

export const buildWallpaperMetadataFromUrl = async (url: string): Promise<WallpaperMetadata> => {
  try {
    const response = await fetch('/api/image-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const metadata = await response.json() as WallpaperMetadata;
      if (metadata.size && metadata.dimensions) {
        return metadata;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Server image metadata failed:', errorData);
    }
  } catch (error) {
    console.warn('Server image metadata unavailable, falling back to browser:', error);
  }

  const originalUrlMetadata = await buildWallpaperMetadataFromOriginalUrl(url);
  if (originalUrlMetadata?.size && originalUrlMetadata?.dimensions) {
    return originalUrlMetadata;
  }

  const byteMetadata = await buildWallpaperMetadataFromBytes(url);
  if (byteMetadata?.size && byteMetadata?.dimensions) {
    return {
      size: originalUrlMetadata?.size || byteMetadata.size,
      dimensions: originalUrlMetadata?.dimensions || byteMetadata.dimensions,
    };
  }

  const [size, dimensions] = await Promise.all([
    getImageSizeFromUrl(url),
    getImageDimensionsFromUrl(url),
  ]);

  return {
    size: originalUrlMetadata?.size || byteMetadata?.size || size,
    dimensions: originalUrlMetadata?.dimensions || byteMetadata?.dimensions || dimensions,
  };
};

export const buildMissingWallpaperMetadataFromUrl = async (
  url: string,
  existingMetadata: WallpaperMetadata = {}
): Promise<WallpaperMetadata> => {
  const byteMetadata = await buildWallpaperMetadataFromBytes(url);

  const [size, dimensions] = await Promise.all([
    existingMetadata.size || byteMetadata?.size ? Promise.resolve(byteMetadata?.size) : getImageSizeFromUrl(url),
    existingMetadata.dimensions || byteMetadata?.dimensions ? Promise.resolve(byteMetadata?.dimensions) : getImageDimensionsFromUrl(url),
  ]);

  return pickDefinedWallpaperMetadata({ size, dimensions });
};

export const getChangedWallpaperMetadata = (
  existingMetadata: WallpaperMetadata,
  nextMetadata: WallpaperMetadata
): WallpaperMetadata => {
  const changedMetadata: WallpaperMetadata = {};

  if (nextMetadata.size && nextMetadata.size !== existingMetadata.size) {
    changedMetadata.size = nextMetadata.size;
  }

  if (nextMetadata.dimensions && nextMetadata.dimensions !== existingMetadata.dimensions) {
    changedMetadata.dimensions = nextMetadata.dimensions;
  }

  return changedMetadata;
};

export const hasCompleteWallpaperMetadata = (metadata: WallpaperMetadata | undefined): boolean => {
  return Boolean(metadata?.size && metadata?.dimensions);
};

export const pickDefinedWallpaperMetadata = (metadata: WallpaperMetadata): WallpaperMetadata => {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== '')
  ) as WallpaperMetadata;
};
