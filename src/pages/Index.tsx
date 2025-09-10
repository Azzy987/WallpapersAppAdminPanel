
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AnalyticCard from '@/components/analytics/AnalyticCard';
import DownloadChart from '@/components/analytics/DownloadChart';
import { getAnalyticsData } from '@/lib/firebase';
import { 
  BarChart3, 
  Image, 
  Tag, 
  Grid3X3, 
  Award, 
  Smartphone, 
  Download, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  Apple
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AnalyticsData {
  activeUsers: number;
  totalDownloads: number;
  totalWallpapers: number;
  totalCategories: number;
  totalTags: number;
  trendingWallpapers: number;
  brandWallpapers: Record<string, number>;
}

const initialData: AnalyticsData = {
  activeUsers: 0,
  totalDownloads: 0,
  totalWallpapers: 0,
  totalCategories: 0,
  totalTags: 0,
  trendingWallpapers: 0,
  brandWallpapers: {}
};

const Index = () => {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsData = await getAnalyticsData();
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate Samsung wallpapers count
  const samsungWallpaperCount = data.brandWallpapers?.Samsung || 0;
  const appleWallpaperCount = data.brandWallpapers?.Apple || 0;
  
  // Calculate total brand wallpapers
  const totalBrandWallpapers = Object.values(data.brandWallpapers || {}).reduce((sum, count) => sum + count, 0);
  
  // Create percentage for wallpaper distribution
  const trendingPercentage = data.totalWallpapers > 0 ? Math.round((data.trendingWallpapers / data.totalWallpapers) * 100) : 0;
  const brandPercentage = data.totalWallpapers > 0 ? Math.round((totalBrandWallpapers / data.totalWallpapers) * 100) : 0;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold animate-fade-in">Dashboard</h1>
          <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
            Welcome to your Wallpaper Admin Dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL WALLPAPERS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : data.totalWallpapers}</div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Image className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>All wallpapers across categories</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TRENDING</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : data.trendingWallpapers}</div>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <span>{trendingPercentage}% of total wallpapers</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DOWNLOADS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : data.totalDownloads}</div>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Download className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>Total wallpaper downloads</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '350ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ACTIVE USERS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : data.activeUsers}</div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>Currently active users</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '400ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CATEGORIES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : data.totalCategories}</div>
                <div className="p-2 bg-violet-500/10 rounded-full">
                  <Grid3X3 className="h-6 w-6 text-violet-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>Total wallpaper categories</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 animate-fade-in shadow-sm hover:shadow transition-all duration-200" style={{ animationDelay: '450ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SAMSUNG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{loading ? '...' : samsungWallpaperCount}</div>
                <div className="p-2 bg-purple-500/10 rounded-full">
                  <Smartphone className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <span>{data.totalWallpapers > 0 ? Math.round((samsungWallpaperCount / data.totalWallpapers) * 100) : 0}% of total wallpapers</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Brand Wallpaper Statistics */}
        {!loading && data.brandWallpapers && Object.keys(data.brandWallpapers).length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Brand Wallpapers Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(data.brandWallpapers).map(([brand, count], index) => (
                  <div key={brand} className="flex flex-col space-y-2 p-4 rounded-lg border bg-card animate-fade-in" style={{ animationDelay: `${550 + index * 50}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{brand.toUpperCase()}</span>
                      <div className={`p-1 rounded-full ${brand === 'Apple' ? 'bg-gray-100' : 'bg-primary/10'}`}>
                        {brand === 'Apple' ? (
                          <Apple className="h-4 w-4 text-gray-700" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.totalWallpapers > 0 ? Math.round((count / data.totalWallpapers) * 100) : 0}% of total
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${brand === 'Apple' ? 'bg-gray-700' : 'bg-primary'}`}
                        style={{ width: `${data.totalWallpapers > 0 ? (count / data.totalWallpapers) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Download Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <DownloadChart />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
