
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface WallpaperBasicInfoProps {
  index: number;
  imageUrl: string;
  wallpaperName: string;
  source: string;
  exclusive: boolean;
  addAsBanner: boolean;
  sameAsCategory?: boolean;
  depthEffect?: boolean;
  launchYear?: string;
  showLaunchYear?: boolean;
  onChange: (field: string, value: any) => void;
}

const WallpaperBasicInfo: React.FC<WallpaperBasicInfoProps> = ({
  index,
  imageUrl,
  wallpaperName,
  source,
  exclusive,
  addAsBanner,
  sameAsCategory = false,
  depthEffect = false,
  launchYear = '',
  showLaunchYear = false,
  onChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {imageUrl && (
          <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={wallpaperName || "Wallpaper preview"} 
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "";
                target.parentElement?.classList.add("bg-gray-200");
                const icon = document.createElement("div");
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                target.parentElement?.appendChild(icon);
              }}
            />
          </div>
        )}
        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor={`imageUrl-${index}`}>Image URL</Label>
            <Input
              id={`imageUrl-${index}`}
              value={imageUrl}
              onChange={(e) => onChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`wallpaperName-${index}`}>Wallpaper Name</Label>
            <Input
              id={`wallpaperName-${index}`}
              value={wallpaperName}
              onChange={(e) => onChange('wallpaperName', e.target.value)}
              placeholder="iPhone 14 Pro"
              className="mt-1"
            />
          </div>
        </div>
      </div>
      
      {/* Only show these fields if sameAsCategory is false */}
      {!sameAsCategory && (
        <>
          <div>
            <Label htmlFor={`source-${index}`}>Source</Label>
            <Input
              id={`source-${index}`}
              value={source}
              onChange={(e) => onChange('source', e.target.value)}
              placeholder="Official"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`exclusive-${index}`}
                checked={exclusive}
                onCheckedChange={(checked) => 
                  onChange('exclusive', checked === true)
                }
              />
              <Label htmlFor={`exclusive-${index}`}>Exclusive</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`addAsBanner-${index}`}
                checked={addAsBanner}
                onCheckedChange={(checked) => 
                  onChange('addAsBanner', checked === true)
                }
              />
              <Label htmlFor={`addAsBanner-${index}`}>Add as Banner</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`depthEffect-${index}`}
                checked={depthEffect}
                onCheckedChange={(checked) => 
                  onChange('depthEffect', checked === true)
                }
              />
              <Label htmlFor={`depthEffect-${index}`}>Depth Effect</Label>
            </div>
          </div>
        </>
      )}
      
      {/* Show launch year field if it's needed */}
      {showLaunchYear && (
        <div>
          <Label htmlFor={`launchYear-${index}`}>Launch Year</Label>
          <Input
            id={`launchYear-${index}`}
            value={launchYear}
            onChange={(e) => onChange('launchYear', e.target.value)}
            placeholder="2025"
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};

export default WallpaperBasicInfo;
