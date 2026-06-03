
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addCategory } from '@/lib/firebase';
import { toast } from 'sonner';
import { ImageIcon, Loader2 } from 'lucide-react';

const CATEGORY_THUMBNAIL_DIR = 'categorythumbnails';

async function uploadCategoryThumbnailToS3(file: File, categoryName: string): Promise<string> {
  const slug = categoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'category';
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : file.type === 'image/png'
      ? '.png'
      : file.type === 'image/webp'
        ? '.webp'
        : '.jpg';
  const filename = `${slug}-${Date.now()}${ext}`;

  const res = await fetch('/api/s3-presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dir: CATEGORY_THUMBNAIL_DIR,
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

  if (fileExists) return publicUrl;

  const put = await fetch(uploadUrl!, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });

  if (!put.ok) throw new Error('S3 upload failed');
  return publicUrl;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesUpdated: () => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onOpenChange,
  onCategoriesUpdated
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'main' | 'brand'>('main');
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'upload'>('url');
  const [thumbnail, setThumbnail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('main');
    setThumbnailSource('url');
    setThumbnail('');
    setImageFile(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setThumbnailSource('upload');
    setUploadingImage(true);

    try {
      const publicUrl = await uploadCategoryThumbnailToS3(
        file,
        categoryName.trim() || file.name.replace(/\.[^.]+$/, '')
      );
      setThumbnail(publicUrl);
      toast.success('Thumbnail uploaded');
    } catch (error) {
      console.error('Error uploading category thumbnail:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload thumbnail');
      setImageFile(null);
      setImagePreview('');
      setThumbnail('');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);

    try {
      let thumbnailUrl = thumbnail.trim();

      if (thumbnailSource === 'upload' && imageFile && !thumbnailUrl) {
        setUploadingImage(true);
        thumbnailUrl = await uploadCategoryThumbnailToS3(imageFile, categoryName.trim());
        setThumbnail(thumbnailUrl);
        setUploadingImage(false);
      }

      await addCategory({
        categoryName: categoryName.trim(),
        categoryType,
        thumbnail: thumbnailUrl || 'https://via.placeholder.com/200'
      });

      toast.success('Category added successfully');
      resetForm();
      onOpenChange(false);
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Nature, Apple, Samsung"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="categoryType">Category Type</Label>
            <RadioGroup
              value={categoryType}
              onValueChange={(value) => setCategoryType(value as 'main' | 'brand')}
              className="flex flex-col space-y-2 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="main" id="categoryType-main" />
                <Label htmlFor="categoryType-main">Main Category</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brand" id="categoryType-brand" />
                <Label htmlFor="categoryType-brand">Brand Category</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <RadioGroup
              value={thumbnailSource}
              onValueChange={(value) => {
                const mode = value as 'url' | 'upload';
                setThumbnailSource(mode);
                if (mode === 'url') {
                  setImageFile(null);
                  setImagePreview('');
                  if (fileRef.current) fileRef.current.value = '';
                } else {
                  setThumbnail('');
                }
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="thumbnail-url" />
                <Label htmlFor="thumbnail-url">Image URL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="thumbnail-upload" />
                <Label htmlFor="thumbnail-upload">Upload image</Label>
              </div>
            </RadioGroup>

            {thumbnailSource === 'url' ? (
              <Input
                id="thumbnail"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://example.com/thumbnail.jpg (optional)"
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => !uploadingImage && fileRef.current?.click()}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Uploading to S3…</span>
                    </div>
                  ) : imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="max-h-32 mx-auto rounded object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm">Click to choose an image</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saved to wallpaperassets/{CATEGORY_THUMBNAIL_DIR}/
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="thumbnailResult">Thumbnail URL</Label>
              <Input
                id="thumbnailResult"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="Filled automatically after upload, or paste a URL"
                className="mt-1"
                readOnly={thumbnailSource === 'upload' && uploadingImage}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddCategory}
            disabled={loading || uploadingImage}
          >
            {loading ? 'Adding...' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
