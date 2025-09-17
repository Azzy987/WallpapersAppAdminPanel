
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardContent, Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDevices, initializeSamsungDevices, initializeIphoneDevices, initializeOneplusDevices, initializeXiaomiDevices, initializeIosVersions, getAllDevices, Device } from '@/lib/firebase';
import { toast } from 'sonner';
import { Smartphone, Upload, Eye, Plus, Edit, Trash2 } from 'lucide-react';

const AddDevices = () => {
  const [brandName, setBrandName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [devices, setDevices] = useState<string[]>([]);
  const [iosVersion, setIosVersion] = useState('');
  const [iosVersions, setIosVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializingDevices, setInitializingDevices] = useState(false);
  const [initializingIphoneDevices, setInitializingIphoneDevices] = useState(false);
  const [initializingOneplusDevices, setInitializingOneplusDevices] = useState(false);
  const [initializingXiaomiDevices, setInitializingXiaomiDevices] = useState(false);
  const [initializingIosVersions, setInitializingIosVersions] = useState(false);
  
  // State for existing devices management
  const [existingDevices, setExistingDevices] = useState<{ [key: string]: Device & { name: string } }>({});
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [viewMode, setViewMode] = useState<'existing' | 'create'>('existing');

  // Load existing devices on component mount
  useEffect(() => {
    const loadExistingDevices = async () => {
      try {
        const devicesData = await getAllDevices();
        setExistingDevices(devicesData);
      } catch (error) {
        console.error('Error loading existing devices:', error);
        toast.error('Failed to load existing devices');
      }
    };

    loadExistingDevices();
  }, []);

  // Handle device selection from dropdown
  const handleDeviceSelect = (deviceBrand: string) => {
    setSelectedDevice(deviceBrand);
    const device = existingDevices[deviceBrand];
    if (device) {
      setBrandName(deviceBrand);
      setDevices([...device.devices]);
      setIosVersions(device.iosVersions || []);
    }
  };

  // Reset form for creating new device
  const handleCreateNew = () => {
    setViewMode('create');
    setSelectedDevice('');
    setBrandName('');
    setDevices([]);
    setIosVersions([]);
  };

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
      
      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
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
      
      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
    } catch (error) {
      console.error('Error initializing Samsung devices:', error);
      toast.error('Failed to initialize Samsung devices');
    } finally {
      setInitializingDevices(false);
    }
  };

  const handleInitializeIphoneDevices = async () => {
    setInitializingIphoneDevices(true);
    
    try {
      const devices = await initializeIphoneDevices();
      toast.success(`Initialized ${devices.length} iPhone device series successfully`);
      
      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
    } catch (error) {
      console.error('Error initializing iPhone devices:', error);
      toast.error('Failed to initialize iPhone devices');
    } finally {
      setInitializingIphoneDevices(false);
    }
  };

  const handleInitializeOneplusDevices = async () => {
    setInitializingOneplusDevices(true);
    
    try {
      const devices = await initializeOneplusDevices();
      toast.success(`Initialized ${devices.length} OnePlus device models successfully`);
      
      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
    } catch (error) {
      console.error('Error initializing OnePlus devices:', error);
      toast.error('Failed to initialize OnePlus devices');
    } finally {
      setInitializingOneplusDevices(false);
    }
  };

  const handleInitializeXiaomiDevices = async () => {
    setInitializingXiaomiDevices(true);

    try {
      const devices = await initializeXiaomiDevices();
      toast.success(`Initialized ${devices.length} Xiaomi device models successfully`);

      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
    } catch (error) {
      console.error('Error initializing Xiaomi devices:', error);
      toast.error('Failed to initialize Xiaomi devices');
    } finally {
      setInitializingXiaomiDevices(false);
    }
  };

  const handleInitializeIosVersions = async () => {
    setInitializingIosVersions(true);
    
    try {
      const versions = await initializeIosVersions();
      toast.success(`Initialized ${versions.length} iOS versions successfully`);
      
      // Reload existing devices
      const devicesData = await getAllDevices();
      setExistingDevices(devicesData);
    } catch (error) {
      console.error('Error initializing iOS versions:', error);
      toast.error('Failed to initialize iOS versions');
    } finally {
      setInitializingIosVersions(false);
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
          Manage device series for brand categories - view existing or create new
        </p>
      </div>

      {/* Device Management Section */}
      <Card className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Device Management
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('existing')}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Existing
              </Button>
              <Button
                variant={viewMode === 'create' ? 'default' : 'outline'}
                size="sm"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'existing' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="device-select">Select Device Brand</Label>
                <Select value={selectedDevice} onValueChange={handleDeviceSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a device brand to view/edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(existingDevices).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand} ({existingDevices[brand].devices.length} devices)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDevice && existingDevices[selectedDevice] && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedDevice}</h4>
                    <p className="text-sm text-muted-foreground">
                      {existingDevices[selectedDevice].devices.length} device series
                      {existingDevices[selectedDevice].iosVersions && 
                        `, ${existingDevices[selectedDevice].iosVersions!.length} iOS versions`
                      }
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Device Series</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {existingDevices[selectedDevice].devices.map((device, index) => (
                        <div key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm">
                          {device}
                        </div>
                      ))}
                    </div>
                  </div>

                  {existingDevices[selectedDevice].iosVersions && existingDevices[selectedDevice].iosVersions!.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">iOS Versions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {existingDevices[selectedDevice].iosVersions!.map((version, index) => (
                          <div key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full px-3 py-1 text-sm">
                            {version}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setViewMode('create');
                      handleDeviceSelect(selectedDevice);
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit {selectedDevice} Devices
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      {/* Quick Initialize Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Initialize Samsung Devices */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Initialize Samsung Devices</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly add all Samsung device series from 2019 and above
                </p>
              </div>
              <Button 
                onClick={handleInitializeSamsungDevices}
                disabled={initializingDevices}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {initializingDevices ? 'Initializing...' : 'Initialize Samsung'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Initialize Apple Devices */}
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Initialize Apple Devices</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly add all iPhone device series from iPhone 3G to iPhone 16
                </p>
              </div>
              <Button 
                onClick={handleInitializeIphoneDevices}
                disabled={initializingIphoneDevices}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {initializingIphoneDevices ? 'Initializing...' : 'Initialize Apple'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Initialize OnePlus Devices */}
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Initialize OnePlus Devices</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly add all OnePlus device models from OnePlus One to OnePlus 13
                </p>
              </div>
              <Button 
                onClick={handleInitializeOneplusDevices}
                disabled={initializingOneplusDevices}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {initializingOneplusDevices ? 'Initializing...' : 'Initialize OnePlus'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Initialize Xiaomi Devices */}
        <Card className="animate-fade-in" style={{ animationDelay: '325ms' }}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Initialize Xiaomi Devices</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly add all Xiaomi/Mi flagship series including Civi and Mix Flip models
                </p>
              </div>
              <Button
                onClick={handleInitializeXiaomiDevices}
                disabled={initializingXiaomiDevices}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {initializingXiaomiDevices ? 'Initializing...' : 'Initialize Xiaomi'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Initialize iOS Versions */}
        <Card className="animate-fade-in" style={{ animationDelay: '350ms' }}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Initialize iOS Versions</h3>
                <p className="text-sm text-muted-foreground">
                  Add iOS versions 1-18 (2007-2024) and iOS 26 (2025) to Apple collection
                </p>
              </div>
              <Button 
                onClick={handleInitializeIosVersions}
                disabled={initializingIosVersions}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {initializingIosVersions ? 'Initializing...' : 'Initialize iOS'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create/Edit Device Form */}
      {viewMode === 'create' && (
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              {selectedDevice ? `Edit ${selectedDevice} Devices` : 'Create New Device Brand'}
            </CardTitle>
          </CardHeader>
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
      )}
    </Layout>
  );
};

export default AddDevices;
