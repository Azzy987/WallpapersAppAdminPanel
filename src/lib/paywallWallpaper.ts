/** S3 folder for paywall banner originals (under wallpaperassets bucket). */
export const PAYWALL_S3_DIR = 'paywall-wallpapers';

/** fit-in size: 360×640 thumbnail dimensions + 10%. */
export const PAYWALL_FIT_IN_DIMENSIONS = '396x704';

const CLOUDFRONT_HOST = 'd1wqpnbk3wcub7.cloudfront.net';

/** Strip any existing fit-in segment from a CloudFront path. */
function cloudFrontImagePath(url: string): string | null {
  if (!url.includes(CLOUDFRONT_HOST)) return null;
  const marker = `${CLOUDFRONT_HOST}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let path = url.substring(idx + marker.length);
  path = path.replace(/^fit-in\/\d+x\d+\//, '');
  return path;
}

/** Build wallpaperUrl with paywall fit-in transform (stored in Firestore). */
export function toPaywallWallpaperUrl(publicUrl: string): string {
  const path = cloudFrontImagePath(publicUrl);
  if (!path) return publicUrl;
  if (publicUrl.includes(`/fit-in/${PAYWALL_FIT_IN_DIMENSIONS}/`)) return publicUrl;
  return `https://${CLOUDFRONT_HOST}/fit-in/${PAYWALL_FIT_IN_DIMENSIONS}/${path}`;
}

/** Preview URL (same as stored wallpaperUrl when saved via this admin). */
export function getPaywallPreviewUrl(wallpaperUrl: string): string {
  return toPaywallWallpaperUrl(wallpaperUrl);
}

export async function uploadPaywallImageToS3(file: File): Promise<string> {
  const slug = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'paywall';
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : '.jpg';
  const filename = `${slug}-${Date.now()}${ext}`;

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

  return toPaywallWallpaperUrl(publicUrl);
}
