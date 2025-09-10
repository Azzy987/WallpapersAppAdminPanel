
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardContent, Card } from '@/components/ui/card';
import { updateDevices, initializeSamsungDevices } from '@/lib/firebase';
import { toast } from 'sonner';
import { Smartphone, Upload } from 'lucide-react';

const AddDevices = () => {
  const [brandName, setBrandName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [devices, setDevices] = useState<string[]>([]);
  const [iosVersion, setIosVersion] = useState('');
  const [iosVersions, setIosVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializingDevices, setInitializingDevices] = useState(false);

  const handleAddDevice = () => {
    if (!deviceName.trim()) return;
    setDevices([...devices, deviceName]);
    setDeviceName('');
  };

  const handleAddIosVersion = () => {
    if (!iosVersion.trim()) return;
    setIosVersions([...iosVersions, iosVersion]);
    setIosVersion('');
  };

  const handleRemoveDevice = (index: number) => {
    setDevices(devices.filter((_, i) => i !== index));
  };

  const handleRemoveIosVersion = (index: number) => {
    setIosVersions(iosVersions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandName.trim()) {
      toast.error('Brand name is required');
      return;
    }
    
    if (devices.length === 0) {
      toast.error('At least one device is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use updateDevices to append instead of overwrite
      await updateDevices(brandName, devices, brandName.toLowerCase() === 'apple' ? iosVersions : undefined);
      
      toast.success(`Devices for ${brandName} added successfully`);
      
      // Reset form
      setBrandName('');
      setDevices([]);
      setIosVersions([]);
    } catch (error) {
      console.error('Error adding devices:', error);
      toast.error('Failed to add devices');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSamsungDevices = async () => {
    setInitializingDevices(true);
    
    try {
      const devices = await initializeSamsungDevices();
      toast.success(`Initialized ${devices.length} Samsung device series successfully`);
    } catch (error) {
      console.error('Error initializing Samsung devices:', error);
      toast.error('Failed to initialize Samsung devices');
    } finally {
      setInitializingDevices(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 animate-fade-in">
          <Smartphone className="h-8 w-8 text-primary" />
          Add Devices
        </h1>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          Add device series to brand categories
        </p>
      </div>
      
      {/* Quick Initialize Samsung Devices */}
      <Card className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Initialize Samsung Devices</h3>
              <p className="text-sm text-muted-foreground">
                Quickly add all Samsung device series from 2019 and above
              </p>
            </div>
            <Button 
              onClick={handleInitializeSamsungDevices}
              disabled={initializingDevices}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {initializingDevices ? 'Initializing...' : 'Initialize Samsung'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Apple, Samsung, Google"
                className="mt-1"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Devices</Label>
              <div className="flex gap-2">
                <Input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., iPhone 14 Series"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddDevice} variant="outline">Add</Button>
              </div>
              
              {devices.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {devices.map((device, index) => (
                    <div key={index} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-1">
                      {device}
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(index)}
                        className="text-primary/70 hover:text-primary"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {brandName.toLowerCase() === 'apple' && (
              <div className="space-y-2">
                <Label>iOS Versions</Label>
                <div className="flex gap-2">
                  <Input
                    value={iosVersion}
                    onChange={(e) => setIosVersion(e.target.value)}
                    placeholder="e.g., iOS 16"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddIosVersion} variant="outline">Add</Button>
                </div>
                
                {iosVersions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {iosVersions.map((version, index) => (
                      <div key={index} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-1">
                        {version}
                        <button
                          type="button"
                          onClick={() => handleRemoveIosVersion(index)}
                          className="text-primary/70 hover:text-primary"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Adding Devices...' : 'Add Devices'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default AddDevices;
