import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  getWallpaperIdByUrl, 
  getBannerByWallpaperUrl, 
  getBannerByWallpaperUrlNested,
  removeWallpaper, 
  getAllTrendingWallpapers,
  getBrandCategories,
  getBrandDevices,
  getAllWallpapersForBrandDevice
} from '@/lib/firebase';
import { Trash2, EditIcon, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WallpaperInfo {
  id: string;
  data: {
    wallpaperName: string;
    imageUrl: string;
    source: string;
    downloads: number;
    views: number;
    category?: string;
    selectedCategories?: string[];
  };
}

interface BrandDevice {
  brand: string;
  deviceSeries: string;
  count: number;
}

const RemoveWallpaper = () => {
  const [searchMode, setSearchMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [wallpaperDetails, setWallpaperDetails] = useState<any[]>([]);
  const [bannerDetails, setBannerDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  const [trendingWallpapers, setTrendingWallpapers] = useState<WallpaperInfo[]>([]);
  const [brandCategories, setBrandCategories] = useState<string[]>([]);
  const [brandDevices, setBrandDevices] = useState<BrandDevice[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedBrandDevice, setSelectedBrandDevice] = useState<BrandDevice | null>(null);
  const [brandWallpapers, setBrandWallpapers] = useState<WallpaperInfo[]>([]);
  const [loadingWallpapers, setLoadingWallpapers] = useState(false);
  const [showTrendingWallpapers, setShowTrendingWallpapers] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingWallpapers(true);
      try {
        const brands = await getBrandCategories();
        setBrandCategories(brands);
        
        const devices: BrandDevice[] = [];
        
        for (const brand of brands) {
          const brandDevices = await getBrandDevices(brand);
          for (const device of brandDevices) {
            const wallpapers = await getAllWallpapersForBrandDevice(brand, device);
            devices.push({
              brand,
              deviceSeries: device,
              count: wallpapers.length
            });
          }
        }
        
        setBrandDevices(devices);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load wallpapers");
      } finally {
        setLoadingWallpapers(false);
      }
    };
    
    fetchInitialData();
  }, []);

  const handleShowTrendingWallpapers = async () => {
    if (trendingWallpapers.length === 0) {
      setLoadingWallpapers(true);
      try {
        const trendingData = await getAllTrendingWallpapers();
        setTrendingWallpapers(trendingData);
      } catch (error) {
        console.error("Error fetching trending wallpapers:", error);
        toast.error("Failed to load trending wallpapers");
      } finally {
        setLoadingWallpapers(false);
      }
    }
    setShowTrendingWallpapers(true);
    setSelectedBrandDevice(null);
  };

  const handleSearch = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setLoading(true);
    try {
      const wallpapers = await getWallpaperIdByUrl(imageUrl);
      setWallpaperDetails(wallpapers);

      // Try both old and new banner structure
      let banner = await getBannerByWallpaperUrl(imageUrl);
      if (!banner) {
        // Try new nested banner structure
        banner = await getBannerByWallpaperUrlNested(imageUrl);
      }
      setBannerDetails(banner);

      if (wallpapers.length === 0 && !banner) {
        toast.error('No wallpaper or banner found with this URL');
      }
    } catch (error) {
      console.error('Error searching for wallpaper:', error);
      toast.error('Failed to search for wallpaper');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (url: string) => {
    if (!url.trim()) {
      toast.error('No image URL provided');
      return;
    }

    setRemoving(true);
    try {
      const removedItems = await removeWallpaper(url);
      
      if (removedItems.length > 0) {
        toast.success('Wallpaper and related items removed successfully');
        
        if (!searchMode) {
          setTrendingWallpapers(prev => prev.filter(w => w.data.imageUrl !== url));
          setBrandWallpapers(prev => prev.filter(w => w.data.imageUrl !== url));
        } else {
          setWallpaperDetails([]);
          setBannerDetails(null);
          setImageUrl('');
        }
      } else {
        toast.error('No items were removed');
      }
    } catch (error) {
      console.error('Error removing wallpaper:', error);
      toast.error('Failed to remove wallpaper');
    } finally {
      setRemoving(false);
    }
  };

  const handleBrandDeviceSelect = async (device: BrandDevice) => {
    setSelectedBrandDevice(device);
    setShowTrendingWallpapers(false);
    setLoadingWallpapers(true);
    
    try {
      const wallpapers = await getAllWallpapersForBrandDevice(device.brand, device.deviceSeries);
      setBrandWallpapers(wallpapers);
    } catch (error) {
      console.error("Error fetching brand wallpapers:", error);
      toast.error("Failed to load brand wallpapers");
    } finally {
      setLoadingWallpapers(false);
    }
  };

  const renderWallpaperGrid = (wallpapers: WallpaperInfo[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {wallpapers.map((wallpaper) => {
        const hasCategories = Boolean(
          wallpaper.data.category || 
          (wallpaper.data.selectedCategories && 
           wallpaper.data.selectedCategories.length > 0)
        );
        
        return (
          <Card key={wallpaper.id} className="overflow-hidden group">
            <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img 
                src={wallpaper.data.imageUrl} 
                alt={wallpaper.data.wallpaperName}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "";
                  target.parentElement?.classList.add("flex", "items-center", "justify-center", "bg-gray-200");
                  const icon = document.createElement("div");
                  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                  target.parentElement?.appendChild(icon);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="text-white text-sm font-medium truncate w-full">
                  {wallpaper.data.wallpaperName}
                </div>
              </div>
            </div>
            <CardFooter className="p-3 flex justify-between">
              <div className="text-xs text-gray-500">
                <span>Downloads: {wallpaper.data.downloads}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-primary"
                  onClick={() => {
                    window.location.href = `/edit-wallpaper?id=${wallpaper.id}`;
                  }}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                {!hasCategories && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(wallpaper.data.imageUrl)}
                    disabled={removing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {hasCategories && (
                  <div className="px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded border border-amber-200">
                    Has Categories
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8 animate-fade-in">Edit/Remove Wallpaper</h1>
      
      <Tabs defaultValue="browse" className="w-full" onValueChange={(value) => setSearchMode(value === 'search')}>
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="search">Search by URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6">
          {!showTrendingWallpapers && !selectedBrandDevice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={handleShowTrendingWallpapers}
              >
                <CardHeader>
                  <CardTitle>Trending Wallpapers</CardTitle>
                  <CardDescription>
                    View and manage trending wallpapers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Brand Wallpapers</CardTitle>
                  <CardDescription>
                    View and manage brand-specific wallpapers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {brandCategories.map((brand) => (
                      <Card 
                        key={brand}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedBrand(brand);
                        }}
                      >
                        <CardHeader className="p-3">
                          <CardTitle className="text-base">{brand}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  
                  {selectedBrand && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">{selectedBrand} Devices</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {brandDevices
                          .filter(device => device.brand === selectedBrand)
                          .map((device) => (
                            <Card 
                              key={`${device.brand}-${device.deviceSeries}`}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => handleBrandDeviceSelect(device)}
                            >
                              <CardHeader className="p-3">
                                <CardTitle className="text-base">{device.deviceSeries}</CardTitle>
                                <CardDescription className="text-xs">
                                  {device.count} wallpapers
                                </CardDescription>
                              </CardHeader>
                            </Card>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {showTrendingWallpapers && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Trending Wallpapers</h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTrendingWallpapers(false);
                    setSelectedBrand(null);
                  }}
                >
                  Back
                </Button>
              </div>
              
              {loadingWallpapers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : trendingWallpapers.length > 0 ? (
                renderWallpaperGrid(trendingWallpapers)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No trending wallpapers found
                </div>
              )}
            </div>
          )}
          
          {selectedBrandDevice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  {selectedBrandDevice.brand} - {selectedBrandDevice.deviceSeries} Wallpapers
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedBrandDevice(null);
                    setBrandWallpapers([]);
                  }}
                >
                  Back
                </Button>
              </div>
              
              {loadingWallpapers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : brandWallpapers.length > 0 ? (
                renderWallpaperGrid(brandWallpapers)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No wallpapers found for this device
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="search">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {(wallpaperDetails.length > 0 || bannerDetails) && (
                <div className="mt-6 space-y-4">
                  <h2 className="text-xl font-semibold">Search Results</h2>

                  {wallpaperDetails.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Wallpapers</h3>
                      <div className="space-y-2">
                        {wallpaperDetails.map((wallpaper, index) => (
                          <div 
                            key={index} 
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <p><span className="font-medium">ID:</span> {wallpaper.id}</p>
                            <p>
                              <span className="font-medium">Location:</span> 
                              {wallpaper.collection === 'TrendingWallpapers' 
                                ? 'Trending Wallpapers' 
                                : `Brand Wallpapers (${wallpaper.brand}/${wallpaper.deviceSeries})`
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bannerDetails && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Banner</h3>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {bannerDetails.id ? (
                          // Old banner structure
                          <>
                            <p><span className="font-medium">ID:</span> {bannerDetails.id}</p>
                            <p><span className="font-medium">Name:</span> {bannerDetails.data.bannerName}</p>
                            <p><span className="font-medium">URL:</span> {bannerDetails.data.bannerUrl}</p>
                          </>
                        ) : (
                          // New nested banner structure
                          <>
                            <p><span className="font-medium">Banner ID:</span> {bannerDetails.bannerId}</p>
                            <p><span className="font-medium">Wallpaper ID:</span> {bannerDetails.wallpaperId}</p>
                            <p><span className="font-medium">App:</span> {bannerDetails.appName}</p>
                            <p><span className="font-medium">Name:</span> {bannerDetails.data.bannerName}</p>
                            <p><span className="font-medium">URL:</span> {bannerDetails.data.bannerUrl}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="destructive" 
                    className="mt-4 w-full flex items-center justify-center gap-2"
                    onClick={() => handleRemove(imageUrl)}
                    disabled={removing}
                  >
                    <Trash2 className="h-4 w-4" />
                    {removing ? 'Removing...' : 'Remove Wallpaper and Related Items'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default RemoveWallpaper;
