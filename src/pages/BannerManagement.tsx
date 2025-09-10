import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  getAllBannersWithApps, 
  migrateBannersToNestedStructure,
  deleteBannerFromApp,
  getAppBanners 
} from '@/lib/firebase';
import { AVAILABLE_APPS } from '@/components/BannerAppSelector';
import { toast } from 'sonner';
import { Smartphone, Eye, Trash2, Upload, Database, Loader2 } from 'lucide-react';

interface BannerData {
  bannerId: string;
  apps: {
    [appName: string]: Array<{
      wallpaperId: string;
      data: {
        bannerName: string;
        bannerUrl: string;
        timestamp?: any;
      };
    }>;
  };
}

interface AppBanner {
  bannerId: string;
  wallpaperId: string;
  appName: string;
  data: {
    bannerName: string;
    bannerUrl: string;
    timestamp?: any;
  };
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [appBanners, setAppBanners] = useState<AppBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'by-app'>('all');

  // Load all banners
  const loadAllBanners = async () => {
    setLoading(true);
    try {
      const allBanners = await getAllBannersWithApps();
      setBanners(allBanners);
      console.log('Loaded banners:', allBanners);
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  // Load banners for specific app
  const loadAppBanners = async (appName: string) => {
    setLoading(true);
    try {
      const banners = await getAppBanners(appName);
      setAppBanners(banners);
      console.log(`Loaded banners for ${appName}:`, banners);
    } catch (error) {
      console.error(`Error loading banners for ${appName}:`, error);
      toast.error(`Failed to load banners for ${appName}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle migration
  const handleMigration = async () => {
    setMigrating(true);
    try {
      const results = await migrateBannersToNestedStructure();
      toast.success(`Migration completed! Migrated ${results.filter(r => r.status === 'migrated').length} banners`);
      
      // Reload banners after migration
      if (viewMode === 'all') {
        await loadAllBanners();
      } else if (selectedApp !== 'all') {
        await loadAppBanners(selectedApp);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  // Handle banner deletion from specific app
  const handleDeleteBannerFromApp = async (bannerId: string, appName: string, wallpaperId: string) => {
    try {
      await deleteBannerFromApp(bannerId, appName, wallpaperId);
      toast.success(`Banner removed from ${appName}`);
      
      // Reload banners
      if (viewMode === 'all') {
        await loadAllBanners();
      } else {
        await loadAppBanners(selectedApp);
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'all' | 'by-app') => {
    setViewMode(mode);
    if (mode === 'all') {
      loadAllBanners();
    } else if (selectedApp !== 'all') {
      loadAppBanners(selectedApp);
    }
  };

  // Handle app selection change
  const handleAppChange = (appName: string) => {
    setSelectedApp(appName);
    if (viewMode === 'by-app' && appName !== 'all') {
      loadAppBanners(appName);
    }
  };

  // Load initial data
  useEffect(() => {
    if (viewMode === 'all') {
      loadAllBanners();
    }
  }, []);

  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 animate-fade-in">
          <Database className="h-8 w-8 text-primary" />
          Banner Management
        </h1>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          Manage app-specific banners and migrate existing banners to nested structure
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Banner Overview
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('all')}
              >
                All Banners
              </Button>
              <Button
                variant={viewMode === 'by-app' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('by-app')}
              >
                By App
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {viewMode === 'by-app' && (
                <div className="flex items-center gap-2">
                  <Label>Select App:</Label>
                  <Select value={selectedApp} onValueChange={handleAppChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Choose app" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Apps</SelectItem>
                      {AVAILABLE_APPS.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleMigration}
              disabled={migrating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {migrating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Migrate Banners
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banner Display */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading banners...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'all' ? (
            // All Banners View
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {banners.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No banners found</p>
                  </CardContent>
                </Card>
              ) : (
                banners.map((banner) => (
                  <Card key={banner.bannerId} className="animate-fade-in">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Banner ID: {banner.bannerId}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(banner.apps).map(([appName, appBanners]) => (
                          <div key={appName} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="secondary">{appName}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {appBanners.length} wallpaper(s)
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {appBanners.map((item) => (
                                <div key={item.wallpaperId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.data.bannerName}</p>
                                    <p className="text-xs text-muted-foreground">ID: {item.wallpaperId}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteBannerFromApp(banner.bannerId, appName, item.wallpaperId)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // By App View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedApp === 'all' ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Select an app to view its banners</p>
                  </CardContent>
                </Card>
              ) : appBanners.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No banners found for {selectedApp}</p>
                  </CardContent>
                </Card>
              ) : (
                appBanners.map((banner) => (
                  <Card key={`${banner.bannerId}-${banner.wallpaperId}`} className="animate-fade-in">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="truncate">{banner.data.bannerName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBannerFromApp(banner.bannerId, banner.appName, banner.wallpaperId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Banner ID:</span> {banner.bannerId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Wallpaper ID:</span> {banner.wallpaperId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">App:</span> {banner.appName}
                        </p>
                        {banner.data.bannerUrl && (
                          <img 
                            src={banner.data.bannerUrl} 
                            alt={banner.data.bannerName}
                            className="w-full h-20 object-cover rounded mt-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default BannerManagement;