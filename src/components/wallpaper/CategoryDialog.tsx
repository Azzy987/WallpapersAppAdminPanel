
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addCategory } from '@/lib/firebase';
import { toast } from 'sonner';

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
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      await addCategory({
        categoryName: categoryName.trim(),
        categoryType,
        thumbnail: thumbnail || 'https://via.placeholder.com/200'
      });
      
      toast.success('Category added successfully');
      setCategoryName('');
      setCategoryType('main');
      setThumbnail('');
      onOpenChange(false);
      
      // Call the callback to refresh categories
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setLoading(false);
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
          
          <div>
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg (optional)"
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddCategory}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
