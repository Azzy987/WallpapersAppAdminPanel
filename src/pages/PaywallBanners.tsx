import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  addPaywallWallpaper,
  deletePaywallWallpaper,
  getPaywallWallpapers,
  updatePaywallWallpaper,
  type PaywallWallpaper,
} from '@/lib/firebase';
import {
  PAYWALL_FIT_IN_DIMENSIONS,
  PAYWALL_S3_DIR,
  getPaywallPreviewUrl,
  toPaywallWallpaperUrl,
  uploadPaywallImageToS3,
} from '@/lib/paywallWallpaper';
import { toast } from 'sonner';
import {
  ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const PaywallBanners: React.FC = () => {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<PaywallWallpaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<PaywallWallpaper | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<PaywallWallpaper | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getPaywallWallpapers());
    } catch {
      toast.error('Failed to load paywall banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!uploadFile) {
      toast.error('Please select an image to upload');
      return;
    }
    setSaving(true);
    try {
      const wallpaperUrl = await uploadPaywallImageToS3(uploadFile);
      await addPaywallWallpaper(wallpaperUrl);
      toast.success('Paywall banner added');
      setUploadFile(null);
      setUploadPreview('');
      if (uploadFileRef.current) uploadFileRef.current.value = '';
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to add paywall banner');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: PaywallWallpaper) => {
    setEditing(item);
    setEditUrl(item.wallpaperUrl);
    setEditFile(null);
    setEditPreview('');
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      let wallpaperUrl = editUrl.trim();
      if (editFile) {
        wallpaperUrl = await uploadPaywallImageToS3(editFile);
      } else if (wallpaperUrl) {
        wallpaperUrl = toPaywallWallpaperUrl(wallpaperUrl);
      }
      if (!wallpaperUrl) {
        toast.error('wallpaperUrl is required');
        return;
      }
      await updatePaywallWallpaper(editing.id, wallpaperUrl);
      toast.success('Paywall banner updated');
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaywallWallpaper(deleteTarget.id);
      toast.success('Paywall banner deleted');
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error('Failed to delete paywall banner');
    }
  };

  const editDisplayPreview = editPreview || (editUrl ? getPaywallPreviewUrl(editUrl) : '');

  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-8">
        <h1
          className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold flex items-center gap-2 animate-fade-in`}
        >
          <Lock className="h-8 w-8 text-primary" />
          Paywall Banners
        </h1>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          Manage paywall wallpapers stored in PaywallWallpapers (wallpaperUrl with fit-in{' '}
          {PAYWALL_FIT_IN_DIMENSIONS})
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Upload paywall banner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Files upload to <code className="text-xs bg-muted px-1 rounded">{PAYWALL_S3_DIR}/</code>{' '}
            on S3. Saved URL uses CloudFront{' '}
            <code className="text-xs bg-muted px-1 rounded">/fit-in/{PAYWALL_FIT_IN_DIMENSIONS}/</code>{' '}
            (10% larger than the 360×640 wallpaper thumbnail).
          </p>
          <input
            ref={uploadFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFileChange}
          />
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => !saving && uploadFileRef.current?.click()}
          >
            {uploadPreview ? (
              <img
                src={uploadPreview}
                alt="Upload preview"
                className="max-h-48 mx-auto rounded object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                <ImageIcon className="h-10 w-10" />
                <span>Click to choose an image</span>
              </div>
            )}
          </div>
          <Button type="button" onClick={handleAdd} disabled={saving || !uploadFile}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload &amp; save
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Saved paywall banners ({items.length})</h2>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No paywall banners yet. Upload one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[396/704] max-h-[320px] bg-muted/40 flex items-center justify-center overflow-hidden">
                <img
                  src={getPaywallPreviewUrl(item.wallpaperUrl)}
                  alt={`Paywall ${item.id}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground truncate" title={item.wallpaperUrl}>
                  {item.wallpaperUrl}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit paywall banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editDisplayPreview && (
              <div className="rounded-lg border bg-muted/30 p-2">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <img
                  src={editDisplayPreview}
                  alt="Edit preview"
                  className="max-h-56 w-full mx-auto rounded object-contain"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-wallpaper-url">wallpaperUrl</Label>
              <Input
                id="edit-wallpaper-url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="mt-1 text-xs"
                placeholder="CloudFront URL"
              />
            </div>
            <div>
              <Label>Replace image</Label>
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEditFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                onClick={() => editFileRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose new image
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete paywall banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the document from PaywallWallpapers. The S3 file is not deleted
              automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default PaywallBanners;
