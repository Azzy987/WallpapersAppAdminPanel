
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, Apple, Smartphone } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, Device } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WallpaperForm {
  source: string;
  exclusive: boolean;
  addAsBanner: boolean;
  selectedBrandApp: string;
  customBrandApp: string;
  subcollectionName: string;
  selectedCategories: string[];
  selectedDeviceSeries: string[];
  selectedIosVersion?: string;
}

interface SharedCategorySettingsProps {
  form: WallpaperForm;
  categories: Category[];
  devices: { [key: string]: Device | null };
  onChange: (field: keyof WallpaperForm, value: any) => void;
  onSourceChange: (value: string) => void;
  onExclusiveChange: (checked: boolean) => void;
  onAddAsBannerChange: (checked: boolean) => void;
  onCategoryChange: (categoryType: 'main' | 'brand', value: string) => void;
  onRemoveCategory: (category: string) => void;
  onAddCategoryClick: () => void;
  onDeviceSeriesChange: (value: string) => void;
  onIosVersionChange: (value: string) => void;
  getSelectedMainCategory: () => string;
  getSelectedBrandCategory: () => string;
}

const SharedCategorySettings: React.FC<SharedCategorySettingsProps> = ({
  form,
  categories,
  devices,
  onSourceChange,
  onExclusiveChange,
  onAddAsBannerChange,
  onCategoryChange,
  onRemoveCategory,
  onAddCategoryClick,
  onDeviceSeriesChange,
  onIosVersionChange,
  getSelectedMainCategory,
  getSelectedBrandCategory
}) => {
  const mainCategories = categories.filter(cat => cat.categoryType === 'main');
  const brandCategories = categories.filter(cat => cat.categoryType === 'brand');
  
  // Get the selected brand category
  const selectedBrandCategory = form.selectedCategories.find(cat => 
    categories.find(c => c.categoryName === cat && c.categoryType === 'brand')
  );
  
  return (
    <Card className="animate-fade-in">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-primary rounded-full"></span>
          Shared Category Settings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="shared-source">Source</Label>
              <Input
                id="shared-source"
                value={form.source}
                onChange={(e) => onSourceChange(e.target.value)}
                placeholder="Official"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared-exclusive"
                  checked={form.exclusive}
                  onCheckedChange={(checked) => onExclusiveChange(checked === true)}
                />
                <Label htmlFor="shared-exclusive">Exclusive</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared-addAsBanner"
                  checked={form.addAsBanner}
                  onCheckedChange={(checked) => onAddAsBannerChange(checked === true)}
                />
                <Label htmlFor="shared-addAsBanner">Add as Banner</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-8 flex items-center gap-1 text-xs"
                onClick={onAddCategoryClick}
              >
                <PlusCircle className="h-3 w-3" />
                Add Category
              </Button>
            </div>
            
            {/* Show selected categories */}
            {form.selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.selectedCategories.map(cat => (
                  <div 
                    key={cat} 
                    className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-1"
                  >
                    {cat}
                    <button 
                      type="button" 
                      onClick={() => onRemoveCategory(cat)}
                      className="text-primary/70 hover:text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Main Categories */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium mb-2 text-gray-500">Main Categories</h4>
              <RadioGroup
                value={getSelectedMainCategory()}
                onValueChange={(value) => onCategoryChange('main', value)}
                className="flex flex-col space-y-2"
              >
                {mainCategories.map(category => (
                  <div key={category.categoryName} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={category.categoryName}
                      id={`shared-main-category-${category.categoryName}`}
                    />
                    <Label htmlFor={`shared-main-category-${category.categoryName}`}>{category.categoryName}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Brand Categories */}
            <div className="space-y-4 mt-6">
              <h4 className="text-sm font-medium mb-2 text-gray-500">Brand Categories</h4>
              <RadioGroup
                value={getSelectedBrandCategory()}
                onValueChange={(value) => onCategoryChange('brand', value)}
                className="flex flex-col space-y-2"
              >
                {brandCategories.map(category => (
                  <div key={category.categoryName} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={category.categoryName}
                      id={`shared-brand-category-${category.categoryName}`}
                    />
                    <Label htmlFor={`shared-brand-category-${category.categoryName}`}>{category.categoryName}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
        
        {/* Device options for selected brand category in shared settings */}
        {selectedBrandCategory && devices[selectedBrandCategory] && (
          <div className="mt-6 p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium text-gray-700">{selectedBrandCategory} Device Series</h4>
              {selectedBrandCategory === 'Apple' && <Apple className="h-4 w-4 text-gray-700" />}
              {selectedBrandCategory !== 'Apple' && <Smartphone className="h-4 w-4 text-gray-700" />}
            </div>
            
            {devices[selectedBrandCategory]?.devices ? (
              <RadioGroup
                value={form.selectedDeviceSeries[0] || ''}
                onValueChange={onDeviceSeriesChange}
                className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2"
              >
                {devices[selectedBrandCategory]?.devices.map(device => (
                  <div key={device} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem
                      value={device}
                      id={`shared-device-${selectedBrandCategory}-${device}`}
                    />
                    <Label htmlFor={`shared-device-${selectedBrandCategory}-${device}`}>{device}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-sm text-gray-500">Loading device series...</div>
            )}
            
            {/* iOS Version selector for Apple in shared settings */}
            {selectedBrandCategory === 'Apple' && devices[selectedBrandCategory]?.iosVersions && devices[selectedBrandCategory]?.iosVersions.length > 0 && (
              <div className="mt-4">
                <Label htmlFor="shared-ios-version">iOS Version</Label>
                <Select
                  value={form.selectedIosVersion}
                  onValueChange={onIosVersionChange}
                >
                  <SelectTrigger id="shared-ios-version" className="mt-1">
                    <SelectValue placeholder="Select iOS Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices[selectedBrandCategory].iosVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedCategorySettings;
