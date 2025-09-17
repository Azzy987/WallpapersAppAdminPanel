import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BannerAppSelectorProps {
  selectedBrandApp: string;
  customBrandApp: string;
  subcollectionName: string;
  onBrandAppChange: (brandApp: string) => void;
  onCustomBrandAppChange: (customApp: string) => void;
  onSubcollectionNameChange: (name: string) => void;
  className?: string;
}

// Available brand apps for banner selection
export const AVAILABLE_BRAND_APPS = [
  { id: 'SamsungWallpapers', name: 'Samsung Wallpapers', description: 'Samsung wallpaper app banners' },
  { id: 'OnePlusWallpapers', name: 'OnePlus Wallpapers', description: 'OnePlus wallpaper app banners' },
  { id: 'XiaomiWallpapers', name: 'Xiaomi Wallpapers', description: 'Xiaomi wallpaper app banners' },
  { id: 'AppleWallpapers', name: 'Apple Wallpapers', description: 'Apple/iPhone wallpaper app banners' },
  { id: 'custom', name: 'Custom App', description: 'Custom brand or app-specific banners' }
];

// Default subcollection suggestions based on brand
export const getDefaultSubcollectionSuggestions = (brandApp: string): string[] => {
  switch (brandApp) {
    case 'SamsungWallpapers':
      return ['SamsungGalaxyBanners', 'SamsungNoteBanners', 'SamsungFoldBanners'];
    case 'OnePlusWallpapers':
      return ['OnePlus7Banners', 'OnePlus8Banners', 'OnePlus9Banners', 'OnePlus10Banners'];
    case 'XiaomiWallpapers':
      return ['XiaomiMiBanners', 'XiaomiCiviBanners', 'XiaomiMixBanners'];
    case 'AppleWallpapers':
      return ['iPhone14Banners', 'iPhone15Banners', 'iPhone16Banners', 'iPhone17Banners'];
    default:
      return ['AppBanners', 'CustomBanners'];
  }
};

const BannerAppSelector: React.FC<BannerAppSelectorProps> = ({
  selectedBrandApp,
  customBrandApp,
  subcollectionName,
  onBrandAppChange,
  onCustomBrandAppChange,
  onSubcollectionNameChange,
  className = ""
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = getDefaultSubcollectionSuggestions(selectedBrandApp);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium">Banner App Configuration</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Configure which brand app and subcollection will contain this banner
        </p>
      </div>

      {/* Brand App Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Brand App</Label>
        <Select value={selectedBrandApp} onValueChange={onBrandAppChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select brand app for banner" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_BRAND_APPS.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{app.name}</span>
                  <span className="text-xs text-muted-foreground">{app.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Brand App Input */}
      {selectedBrandApp === 'custom' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Brand App Name</Label>
          <Input
            value={customBrandApp}
            onChange={(e) => onCustomBrandAppChange(e.target.value)}
            placeholder="Enter custom brand app name (e.g., 'MyCustomWallpapers')"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This will create: Banners/{customBrandApp || 'CustomApp'}/...
          </p>
        </div>
      )}

      {/* Subcollection Name */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Subcollection Name</Label>
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              {showSuggestions ? 'Hide' : 'Show'} suggestions
            </button>
          )}
        </div>

        <Input
          value={subcollectionName}
          onChange={(e) => onSubcollectionNameChange(e.target.value)}
          placeholder="Enter subcollection name (e.g., 'OnePlus7Banners')"
          className="w-full"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            <p className="text-xs text-muted-foreground">Suggested names:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    onSubcollectionNameChange(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Final structure: Banners/
          {selectedBrandApp === 'custom' ? (customBrandApp || 'CustomApp') : selectedBrandApp}/
          {subcollectionName || 'SubcollectionName'}/banner-document
        </p>
      </div>

      {/* Current Configuration Summary */}
      {selectedBrandApp && subcollectionName && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Banner will be created in:</span><br/>
            <code className="text-xs bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">
              Banners/
              {selectedBrandApp === 'custom' ? (customBrandApp || 'CustomApp') : selectedBrandApp}/
              {subcollectionName}/
              [banner-document]
            </code>
          </p>
        </div>
      )}
    </div>
  );
};

export default BannerAppSelector;