import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, Link as LinkIcon, Upload, Check, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
const UploadWallpaper: React.FC = () => {
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(null);
  const [dir, setDir] = useState('wallpapers');
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Upload Wallpaper | Admin';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Upload wallpapers directly to S3 and use CloudFront thumbnails.';
    if (meta) meta.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      m.setAttribute('content', content);
      document.head.appendChild(m);
    }
    // Canonical
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.origin + '/upload-wallpaper');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPublicUrl(null);
    setThumbnailUrl(null);
  };

  const computeSampleThumb = (template: string, w = 360, h = 640) => template.replace('{w}', String(w)).replace('{h}', String(h));

  const handleUpload = async () => {
    if (!file) return toast.error('Please choose a file');
    setUploading(true);
    try {
      // 1) Get a presigned URL
      const { data, error } = await supabase.functions.invoke('s3-presign-upload', {
        body: {
          dir,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        },
      });
      if (error) throw error;
      const { uploadUrl, publicUrl, thumbnailTemplate } = data as { uploadUrl: string; publicUrl: string; thumbnailTemplate: string };

      // 2) Upload to S3
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error('Upload failed');

      setPublicUrl(publicUrl);
      setThumbnailUrl(computeSampleThumb(thumbnailTemplate));
      toast.success('Uploaded successfully');
    } catch (e: any) {
      console.error('Upload error:', e);
      if (e instanceof FunctionsHttpError) {
        try {
          const errorMessage = await e.context.json();
          console.error('Function returned an error', errorMessage);
          toast.error(errorMessage?.error || errorMessage?.message || 'Edge function error');
        } catch (parseErr) {
          console.error('Failed to parse error context', parseErr);
          toast.error(e?.message || 'Edge function error');
        }
      } else {
        toast.error(e?.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const canUpload = useMemo(() => !!file && !!dir, [file, dir]);

  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold flex items-center gap-2`}>
          <ImagePlus className="h-8 w-8 text-primary" />
          Upload Wallpaper (S3)
        </h1>
        <p className="text-muted-foreground">Directly upload to S3 and get a CloudFront URL with on-the-fly thumbnails.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> File & Destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select image</Label>
              <Input id="file" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dir">Folder/path in bucket</Label>
              <Input id="dir" value={dir} onChange={(e) => setDir(e.target.value)} placeholder="e.g. wallpapers/nature/2025" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={handleUpload} disabled={!canUpload || uploading}>
              {uploading ? 'Uploading…' : 'Upload to S3'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {publicUrl && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Uploaded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Original URL</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={publicUrl} />
                <Button variant="secondary" size="icon" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Copied'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {thumbnailUrl && (
              <div className="space-y-2">
                <Label>Sample thumbnail (360x640)</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={thumbnailUrl} />
                  <Button variant="secondary" size="icon" onClick={() => { navigator.clipboard.writeText(thumbnailUrl!); toast.success('Copied'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <img src={thumbnailUrl} alt="Uploaded thumbnail preview" className="max-h-[320px] rounded-md border" loading="lazy" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default UploadWallpaper;
