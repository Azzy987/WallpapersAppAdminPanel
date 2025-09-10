import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface BannerAppSelectorProps {
  selectedApps: string[];
  onAppToggle: (appName: string, checked: boolean) => void;
  className?: string;
}

// Available apps for banner selection
export const AVAILABLE_APPS = [
  { id: 'iPhone17', name: 'iPhone 17', description: 'iPhone 17 wallpaper app' },
  { id: 'Samsung', name: 'Samsung', description: 'Samsung wallpaper app' },
  { id: 'OnePlus', name: 'OnePlus', description: 'OnePlus wallpaper app' },
  { id: 'General', name: 'General', description: 'General/default wallpaper app' }
];

const BannerAppSelector: React.FC<BannerAppSelectorProps> = ({
  selectedApps,
  onAppToggle,
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium">Select Apps for Banner</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Choose which apps will display this banner
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABLE_APPS.map((app) => (
          <div
            key={app.id}
            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Checkbox
              id={app.id}
              checked={selectedApps.includes(app.id)}
              onCheckedChange={(checked) => onAppToggle(app.id, checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={app.id}
                className="text-sm font-medium cursor-pointer"
              >
                {app.name}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {app.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedApps.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Selected apps:</span>{' '}
            {selectedApps
              .map(appId => AVAILABLE_APPS.find(app => app.id === appId)?.name)
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BannerAppSelector;