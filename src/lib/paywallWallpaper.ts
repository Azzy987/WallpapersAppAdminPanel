/** S3 folder for paywall banner originals (under wallpaperassets bucket). */
export const PAYWALL_S3_DIR = 'paywall-wallpapers';

/** Default fit-in size: 360×640 thumbnail + 10%. */
export const PAYWALL_FIT_IN_DIMENSIONS = '396x704';

export type FitInPreset = {
  id: string;
  label: string;
  dimensions: string;
  description?: string;
};

export const PAYWALL_FIT_IN_PRESETS: FitInPreset[] = [
  { id: 'small-square', label: 'Small square', dimensions: '256x256', description: '256 × 256' },
  { id: 'thumbnail', label: 'Thumbnail', dimensions: '360x640', description: '360 × 640 (wallpaper thumb)' },
  { id: 'paywall', label: 'Paywall (+10%)', dimensions: '396x704', description: '396 × 704 (default)' },
  { id: 'large-portrait', label: 'Large portrait', dimensions: '540x960', description: '540 × 960' },
  { id: 'wide', label: 'Wide banner', dimensions: '640x360', description: '640 × 360' },
  { id: 'custom', label: 'Custom size', dimensions: '', description: 'Enter width & height' },
];

const CLOUDFRONT_HOST = 'd1wqpnbk3wcub7.cloudfront.net';

/** Strip any existing fit-in segment from a CloudFront path. */
export function cloudFrontImagePath(url: string): string | null {
  if (!url.includes(CLOUDFRONT_HOST)) return null;
  const marker = `${CLOUDFRONT_HOST}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let path = url.substring(idx + marker.length);
  path = path.replace(/^fit-in\/\d+x\d+\//, '');
  return path;
}

export function parseFitInDimensions(url: string): string | null {
  const match = url.match(/\/fit-in\/(\d+x\d+)\//);
  return match ? match[1] : null;
}

export function normalizeFitInDimensions(width: string, height: string): string | null {
  const w = parseInt(width.trim(), 10);
  const h = parseInt(height.trim(), 10);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || w > 4096 || h > 4096) {
    return null;
  }
  return `${w}x${h}`;
}

export function dimensionsToAspectRatio(dimensions: string): number {
  const [w, h] = dimensions.split('x').map(Number);
  if (!w || !h) return 396 / 704;
  return w / h;
}

/** Build wallpaperUrl with paywall fit-in transform (stored in Firestore). */
export function toPaywallWallpaperUrl(
  publicUrl: string,
  dimensions: string = PAYWALL_FIT_IN_DIMENSIONS
): string {
  const path = cloudFrontImagePath(publicUrl);
  if (!path) return publicUrl;
  if (publicUrl.includes(`/fit-in/${dimensions}/`)) return publicUrl;
  return `https://${CLOUDFRONT_HOST}/fit-in/${dimensions}/${path}`;
}

/** Preview URL — uses embedded fit-in when present. */
export function getPaywallPreviewUrl(wallpaperUrl: string): string {
  if (wallpaperUrl.includes('/fit-in/')) return wallpaperUrl;
  return toPaywallWallpaperUrl(wallpaperUrl, PAYWALL_FIT_IN_DIMENSIONS);
}

export async function uploadPaywallImageToS3(
  file: File,
  dimensions: string = PAYWALL_FIT_IN_DIMENSIONS,
  uniqueSuffix = ''
): Promise<string> {
  const slug = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'paywall';
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : '.jpg';
  const filename = `${slug}-${Date.now()}${uniqueSuffix}${ext}`;

  const res = await fetch('/api/s3-presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dir: PAYWALL_S3_DIR,
      filename,
      contentType: file.type || 'image/jpeg',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as { error?: string }).error || 'Failed to get presigned URL');
  }

  const { uploadUrl, publicUrl, fileExists } = await res.json() as {
    uploadUrl?: string;
    publicUrl: string;
    fileExists?: boolean;
  };

  if (!fileExists && uploadUrl) {
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    });
    if (!put.ok) throw new Error('S3 upload failed');
  }

  return toPaywallWallpaperUrl(publicUrl, dimensions);
}
