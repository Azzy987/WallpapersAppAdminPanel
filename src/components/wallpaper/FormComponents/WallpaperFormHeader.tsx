
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Copy } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WallpaperFormHeaderProps {
  onAddSameCategory: (count?: number) => void;
  onAddDifferentCategory: () => void;
  wallpaperCount: number;
  setWallpaperCount: (count: number) => void;
}

const WallpaperFormHeader: React.FC<WallpaperFormHeaderProps> = ({ 
  onAddSameCategory, 
  onAddDifferentCategory,
  wallpaperCount,
  setWallpaperCount
}) => {
  const isMobile = useIsMobile();
  
  const handleAddSame = () => {
    if (wallpaperCount > 0) {
      onAddSameCategory(wallpaperCount);
    } else {
      onAddSameCategory(1);
    }
  };
  
  return (
    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'flex-row justify-between'} items-center mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700`}>
      <h2 className="text-lg font-medium dark:text-white">Wallpaper Forms</h2>
      
      <div className={`flex ${isMobile ? 'flex-col w-full space-y-3' : 'flex-row space-x-3'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-28">
            <Label htmlFor="wallpaperCount" className="text-sm dark:text-gray-300">Count</Label>
            <Input
              id="wallpaperCount"
              type="number"
              min="1"
              max="20" 
              value={wallpaperCount}
              onChange={(e) => setWallpaperCount(parseInt(e.target.value) || 1)}
              className="w-full h-9"
            />
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={handleAddSame}
            className="flex items-center gap-1 dark:text-white dark:border-gray-600"
          >
            <Copy className="h-4 w-4" />
            <span>Add {wallpaperCount > 1 ? `${wallpaperCount} of Same` : 'Same'} Category</span>
          </Button>
        </div>
        
        <Button 
          type="button" 
          variant="default" 
          size={isMobile ? "sm" : "default"}
          onClick={onAddDifferentCategory}
          className={`flex items-center gap-1 ${isMobile ? 'w-full' : ''}`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Different Category</span>
        </Button>
      </div>
    </div>
  );
};

export default WallpaperFormHeader;
