
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
  onDeviceSeriesChange: (brand: string, deviceSeries: string, checked: boolean) => void;
  onIosVersionChange: (version: string) => void;
  formId: string;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  brandCategory,
  devices,
  selectedDeviceSeries,
  selectedIosVersion,
  onDeviceSeriesChange,
  onIosVersionChange,
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
        <h4 className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-300">{brandCategory} Device Series</h4>
        {brandCategory === 'Apple' && <Apple className="h-4 w-4 text-gray-500 dark:text-gray-300" />}
      </div>

      {/* Search input */}
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search series or models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {devices[brandCategory]?.devices ? (
        <RadioGroup
          value={selectedDeviceSeries[0] || ''}
          onValueChange={(value) => {
            onDeviceSeriesChange(brandCategory, value, true);
            setSelectedModel(null);
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2"
        >
          {filterDevices(devices[brandCategory]?.devices || []).map(device => {
            return (
              <div key={device} className="flex flex-col space-y-1 py-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={device}
                    id={`device-${formId}-${brandCategory}-${device}`}
                  />
                  <Label 
                    htmlFor={`device-${formId}-${brandCategory}-${device}`}
                    className="text-sm font-medium dark:text-gray-200"
                  >
                    {device}
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading device series...</div>
      )}
      
      {/* iOS Version selector for Apple */}
      {brandCategory === 'Apple' && devices[brandCategory]?.iosVersions && devices[brandCategory]?.iosVersions.length > 0 && (
        <div className="mt-4">
          <Label htmlFor={`ios-version-${formId}`} className="dark:text-gray-300">iOS Version</Label>
          <Select
            value={selectedIosVersion}
            onValueChange={onIosVersionChange}
          >
            <SelectTrigger id={`ios-version-${formId}`} className="mt-1">
              <SelectValue placeholder="Select iOS Version" />
            </SelectTrigger>
            <SelectContent>
              {devices[brandCategory].iosVersions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;
