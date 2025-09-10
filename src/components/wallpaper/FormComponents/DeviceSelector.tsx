
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Apple, Search } from 'lucide-react';
import { Device } from '@/lib/firebase';
import { samsungDeviceModels } from '@/lib/firebase';
import { Input } from '@/components/ui/input';

interface DeviceSelectorProps {
  brandCategory: string;
  devices: { [key: string]: Device | null };
  selectedDeviceSeries: string[];
  selectedIosVersion?: string;
  appleSelectionType?: 'devices' | 'iosVersions';
  onDeviceSeriesChange: (brand: string, deviceSeries: string, checked: boolean) => void;
  onIosVersionChange: (version: string) => void;
  onAppleSelectionTypeChange?: (type: 'devices' | 'iosVersions') => void;
  formId: string;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  brandCategory,
  devices,
  selectedDeviceSeries,
  selectedIosVersion,
  appleSelectionType = 'devices',
  onDeviceSeriesChange,
  onIosVersionChange,
  onAppleSelectionTypeChange,
  formId
}) => {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const getDeviceModels = (series: string) => {
    // Since samsungDeviceModels is now an array of devices, we don't need nested models
    return [];
  };

  const handleModelSelect = (model: string, series: string) => {
    setSelectedModel(model);
  };

  const filterDevices = (devices: string[]) => {
    return devices.filter(device => 
      device.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-300">{brandCategory} Selection</h4>
        {brandCategory === 'Apple' && <Apple className="h-4 w-4 text-gray-500 dark:text-gray-300" />}
      </div>

      {/* Apple Selection Type Radio Buttons */}
      {brandCategory === 'Apple' && onAppleSelectionTypeChange && (
        <div className="mb-4">
          <Label className="text-sm font-medium mb-3 block">Selection Type</Label>
          <RadioGroup
            value={appleSelectionType}
            onValueChange={(value) => onAppleSelectionTypeChange(value as 'devices' | 'iosVersions')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="devices" id={`apple-devices-${formId}`} />
              <Label htmlFor={`apple-devices-${formId}`} className="text-sm">
                iPhone Devices
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="iosVersions" id={`apple-ios-${formId}`} />
              <Label htmlFor={`apple-ios-${formId}`} className="text-sm">
                iOS Versions
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Search input */}
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              brandCategory === 'Apple' && appleSelectionType === 'iosVersions' 
                ? "Search iOS versions..." 
                : "Search device series..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Show devices or iOS versions based on Apple selection */}
      {brandCategory === 'Apple' && appleSelectionType === 'iosVersions' ? (
        // iOS Versions for Apple
        devices[brandCategory]?.iosVersions ? (
          <div>
            <Label className="text-sm font-medium mb-3 block">iOS Version (Select One)</Label>
            <RadioGroup
              value={selectedIosVersion || ''}
              onValueChange={onIosVersionChange}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2"
            >
              {filterDevices(devices[brandCategory].iosVersions || []).map(version => (
                <div key={version} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={version}
                    id={`ios-${formId}-${version.replace(/\s+/g, '-')}`}
                  />
                  <Label 
                    htmlFor={`ios-${formId}-${version.replace(/\s+/g, '-')}`}
                    className="text-sm font-medium dark:text-gray-200"
                  >
                    {version}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading iOS versions...</div>
        )
      ) : (
        // Device Series (for all brands including Apple when devices is selected)
        devices[brandCategory]?.devices ? (
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {brandCategory === 'Apple' ? 'iPhone Device (Select One)' : 'Device Series (Select One)'}
            </Label>
            <RadioGroup
              value={selectedDeviceSeries[0] || ''}
              onValueChange={(value) => {
                onDeviceSeriesChange(brandCategory, value, true);
                setSelectedModel(null);
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2"
            >
              {filterDevices(devices[brandCategory]?.devices || []).map(device => (
                <div key={device} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={device}
                    id={`device-${formId}-${brandCategory}-${device.replace(/\s+/g, '-')}`}
                  />
                  <Label 
                    htmlFor={`device-${formId}-${brandCategory}-${device.replace(/\s+/g, '-')}`}
                    className="text-sm font-medium dark:text-gray-200"
                  >
                    {device}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading device series...</div>
        )
      )}
    </div>
  );
};

export default DeviceSelector;
