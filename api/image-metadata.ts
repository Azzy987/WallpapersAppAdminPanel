import type { VercelRequest, VercelResponse } from '@vercel/node';

type Metadata = {
  size?: string;
  dimensions?: string;
};

const formatBytes = (bytes?: number): string | undefined => {
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

const stripCloudFrontFitIn = (url: string): string => {
  return url.replace(/\/fit-in\/\d+x\d+\//, '/');
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

const parseDimensions = (buffer: ArrayBuffer): string | undefined => {
  const view = new DataView(buffer);
  return parsePngDimensions(view) || parseJpegDimensions(view) || parseWebpDimensions(view);
};

const getMetadata = async (url: string): Promise<Metadata> => {
  const sourceUrl = stripCloudFrontFitIn(url);
  let size: string | undefined;

  const headResponse = await fetch(sourceUrl, { method: 'HEAD' });
  if (headResponse.ok) {
    const contentLength = headResponse.headers.get('content-length');
    if (contentLength) {
      size = formatBytes(Number(contentLength));
    }
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Image fetch failed with HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const dimensions = parseDimensions(buffer);

  return {
    size: size || formatBytes(buffer.byteLength),
    dimensions,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const metadata = await getMetadata(url);
    if (!metadata.size || !metadata.dimensions) {
      return res.status(422).json({ error: 'Incomplete metadata', metadata });
    }

    return res.status(200).json(metadata);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
