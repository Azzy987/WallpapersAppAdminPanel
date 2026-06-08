export interface WallpaperMetadata {
  size?: string;
  dimensions?: string;
}

export interface UploadedWallpaperItem {
  url: string;
  metadata?: WallpaperMetadata;
}

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

const getImageDimensions = (src: string): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve(`${image.naturalWidth}x${image.naturalHeight}`);
      } else {
        resolve(undefined);
      }
    };

    image.onerror = () => resolve(undefined);
    image.src = src;
  });
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
  return getImageDimensions(url);
};

export const getImageSizeFromUrl = async (url: string): Promise<string | undefined> => {
  if (!url) return undefined;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return undefined;

    const contentLength = response.headers.get('content-length');
    if (!contentLength) return undefined;

    const bytes = Number(contentLength);
    return formatBytes(bytes);
  } catch (error) {
    console.warn('Unable to read image size from URL:', error);
    return undefined;
  }
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
  const [size, dimensions] = await Promise.all([
    getImageSizeFromUrl(url),
    getImageDimensionsFromUrl(url),
  ]);

  return { size, dimensions };
};

export const hasCompleteWallpaperMetadata = (metadata: WallpaperMetadata | undefined): boolean => {
  return Boolean(metadata?.size && metadata?.dimensions);
};

export const pickDefinedWallpaperMetadata = (metadata: WallpaperMetadata): WallpaperMetadata => {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== '')
  ) as WallpaperMetadata;
};
