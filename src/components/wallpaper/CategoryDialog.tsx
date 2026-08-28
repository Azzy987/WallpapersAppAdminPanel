
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addCategory, updateCategoryThumbnail, updateCategorySeriesless, type Category } from '@/lib/firebase';
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
  editingCategory?: Category | null;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onOpenChange,
  onCategoriesUpdated,
  editingCategory = null,
}) => {
  const isEditMode = editingCategory != null;

  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'main' | 'brand'>('main');
  const [seriesless, setSeriesless] = useState(false);
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'upload'>('url');
  const [thumbnail, setThumbnail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewUrl = imagePreview || thumbnail.trim() || '';

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('main');
    setSeriesless(false);
    setThumbnailSource('url');
    setThumbnail('');
    setImageFile(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (editingCategory) {
      setCategoryName(editingCategory.categoryName);
      setCategoryType(editingCategory.categoryType);
      setSeriesless(editingCategory.seriesless === true);
      setThumbnail(editingCategory.thumbnail || '');
      setThumbnailSource('url');
      setImageFile(null);
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
    } else {
      resetForm();
    }
  }, [open, editingCategory]);

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

    const nameForUpload = categoryName.trim() || editingCategory?.categoryName || file.name.replace(/\.[^.]+$/, '');

    try {
      const publicUrl = await uploadCategoryThumbnailToS3(file, nameForUpload);
      setThumbnail(publicUrl);
      toast.success('Thumbnail uploaded');
    } catch (error) {
      console.error('Error uploading category thumbnail:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload thumbnail');
      setImageFile(null);
      setImagePreview('');
      setThumbnail(editingCategory?.thumbnail || '');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleThumbnailUrlChange = (value: string) => {
    setThumbnail(value);
    if (thumbnailSource === 'url') {
      setImagePreview('');
    }
  };

  const handleSave = async () => {
    if (isEditMode) {
      if (!editingCategory) return;

      setLoading(true);
      try {
        let thumbnailUrl = thumbnail.trim();

        if (thumbnailSource === 'upload' && imageFile && !thumbnailUrl) {
          setUploadingImage(true);
          thumbnailUrl = await uploadCategoryThumbnailToS3(imageFile, editingCategory.categoryName);
          setThumbnail(thumbnailUrl);
          setUploadingImage(false);
        }

        if (!thumbnailUrl) {
          toast.error('Thumbnail URL is required');
          return;
        }

        await updateCategoryThumbnail(editingCategory.categoryName, thumbnailUrl);

        if (
          editingCategory.categoryType === 'brand' &&
          seriesless !== (editingCategory.seriesless === true)
        ) {
          await updateCategorySeriesless(editingCategory.categoryName, seriesless);
        }

        toast.success('Category updated');
        resetForm();
        onOpenChange(false);
        onCategoriesUpdated();
      } catch (error) {
        console.error('Error updating category thumbnail:', error);
        toast.error('Failed to update category thumbnail');
      } finally {
        setLoading(false);
        setUploadingImage(false);
      }
      return;
    }

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
        thumbnail: thumbnailUrl || 'https://via.placeholder.com/200',
        seriesless: categoryType === 'brand' ? seriesless : false,
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

  const thumbnailFields = (
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

      {previewUrl && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          <img
            src={previewUrl}
            alt="Category thumbnail preview"
            className="max-h-36 w-full rounded object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {thumbnailSource === 'url' ? (
        <Input
          id="thumbnail"
          value={thumbnail}
          onChange={(e) => handleThumbnailUrlChange(e.target.value)}
          placeholder="https://example.com/thumbnail.jpg"
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
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Current thumbnail"
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
          onChange={(e) => handleThumbnailUrlChange(e.target.value)}
          placeholder="Filled automatically after upload, or paste a URL"
          className="mt-1"
          readOnly={thumbnailSource === 'upload' && uploadingImage}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Category — ${editingCategory?.categoryName}` : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditMode ? (
            <>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{editingCategory?.categoryName}</span>
                {' · '}
                {editingCategory?.categoryType === 'main' ? 'Main Category' : 'Brand Category'}
              </div>

              {editingCategory?.categoryType === 'brand' && (
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="editCategorySeriesless"
                    checked={seriesless}
                    onChange={(e) => setSeriesless(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <Label htmlFor="editCategorySeriesless">No device series</Label>
                    <p className="text-xs text-muted-foreground">
                      For brands with no device lineup, such as a game or franchise.
                      Hides the device series picker and does not require one on upload.
                    </p>
                  </div>
                </div>
              )}

              {thumbnailFields}
            </>
          ) : (
            <>
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

              {categoryType === 'brand' && (
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="categorySeriesless"
                    checked={seriesless}
                    onChange={(e) => setSeriesless(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <Label htmlFor="categorySeriesless">No device series</Label>
                    <p className="text-xs text-muted-foreground">
                      For brands with no device lineup, such as a game or franchise.
                      Hides the device series picker and does not require one on upload.
                    </p>
                  </div>
                </div>
              )}

              {thumbnailFields}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || uploadingImage}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || uploadingImage}
          >
            {loading
              ? isEditMode
                ? 'Saving...'
                : 'Adding...'
              : isEditMode
                ? 'Save Thumbnail'
                : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
