
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WallpaperGrid from '@/components/wallpaper/WallpaperGrid';
import { 
  getAllTrendingWallpapers, 
  getAllWallpapersForBrand,
  deleteWallpapersByCategory,
} from '@/lib/firebase';
import { Loader2, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Wallpaper {
  id: string;
  data: {
    imageUrl: string;
    wallpaperName: string;
    thumbnailUrl?: string;
    views?: number;
    downloads?: number;
    timestamp?: any;
    [key: string]: any;
  };
}

type SortField = 'timestamp' | 'views' | 'downloads' | 'wallpaperName';
type SortDirection = 'asc' | 'desc';

const EditWallpaper = () => {
  const [trendingWallpapers, setTrendingWallpapers] = useState<Wallpaper[]>([]);
  const [samsungWallpapers, setSamsungWallpapers] = useState<Wallpaper[]>([]);
  const [appleWallpapers, setAppleWallpapers] = useState<Wallpaper[]>([]);
  const [oneplusWallpapers, setOneplusWallpapers] = useState<Wallpaper[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSamsung, setLoadingSamsung] = useState(true);
  const [loadingApple, setLoadingApple] = useState(true);
  const [loadingOneplus, setLoadingOneplus] = useState(true);
  const [groupedSamsungWallpapers, setGroupedSamsungWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedAppleWallpapers, setGroupedAppleWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedOneplusWallpapers, setGroupedOneplusWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedTrendingWallpapers, setGroupedTrendingWallpapers] = useState<Record<string, Wallpaper[]>>({});
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter states
  const [selectedTrendingCategory, setSelectedTrendingCategory] = useState<string>('all');
  const [selectedSamsungSeries, setSelectedSamsungSeries] = useState<string>('all');
  const [selectedAppleSeries, setSelectedAppleSeries] = useState<string>('all');
  const [selectedOneplusSeries, setSelectedOneplusSeries] = useState<string>('all');

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        // Fetch trending wallpapers
        setLoadingTrending(true);
        const trendingData = await getAllTrendingWallpapers();
        setTrendingWallpapers(trendingData);
        
        // Group trending wallpapers by categories
        const trendingGrouped = trendingData.reduce((acc: Record<string, Wallpaper[]>, wallpaper) => {
          const categories = wallpaper.data.category ? [wallpaper.data.category] : ['Other'];
          categories.forEach(category => {
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(wallpaper);
          });
          return acc;
        }, {});
        setGroupedTrendingWallpapers(trendingGrouped);
        setLoadingTrending(false);

        // Fetch Samsung wallpapers
        setLoadingSamsung(true);
        const samsungData = await getAllWallpapersForBrand('Samsung');
        setSamsungWallpapers(samsungData);
        
        // Group Samsung wallpapers by series
        const grouped = samsungData.reduce((acc: Record<string, Wallpaper[]>, wallpaper) => {
          const series = wallpaper.data.series || 'Other';
          if (!acc[series]) {
            acc[series] = [];
          }
          acc[series].push(wallpaper);
          return acc;
        }, {});
        
        setGroupedSamsungWallpapers(grouped);
        setLoadingSamsung(false);

        // Fetch Apple wallpapers
        setLoadingApple(true);
        const appleData = await getAllWallpapersForBrand('Apple');
        setAppleWallpapers(appleData);
        
        // Group Apple wallpapers by series
        const appleGrouped = appleData.reduce((acc: Record<string, Wallpaper[]>, wallpaper) => {
          const series = wallpaper.data.series || 'Other';
          if (!acc[series]) {
            acc[series] = [];
          }
          acc[series].push(wallpaper);
          return acc;
        }, {});
        setGroupedAppleWallpapers(appleGrouped);
        setLoadingApple(false);

        // Fetch OnePlus wallpapers
        setLoadingOneplus(true);
        const oneplusData = await getAllWallpapersForBrand('OnePlus');
        setOneplusWallpapers(oneplusData);
        
        // Group OnePlus wallpapers by series
        const oneplusGrouped = oneplusData.reduce((acc: Record<string, Wallpaper[]>, wallpaper) => {
          const series = wallpaper.data.series || 'Other';
          if (!acc[series]) {
            acc[series] = [];
          }
          acc[series].push(wallpaper);
          return acc;
        }, {});
        setGroupedOneplusWallpapers(oneplusGrouped);
        setLoadingOneplus(false);
      } catch (error) {
        console.error('Error fetching wallpapers:', error);
        setLoadingTrending(false);
        setLoadingSamsung(false);
        setLoadingApple(false);
        setLoadingOneplus(false);
      }
    };
    
    fetchWallpapers();
  }, []);

  // Sort wallpapers function
  const sortWallpapers = (wallpapers: Wallpaper[], field: SortField, direction: SortDirection) => {
    return [...wallpapers].sort((a, b) => {
      let valueA = a.data[field];
      let valueB = b.data[field];
      
      // Handle timestamp specially since it may be an object
      if (field === 'timestamp') {
        // Convert Firebase timestamp objects to numbers for comparison
        const getTimestampValue = (timestamp: any) => {
          if (!timestamp) return 0;
          if (timestamp.seconds) return timestamp.seconds;
          if (timestamp.toDate) return timestamp.toDate().getTime() / 1000;
          return 0;
        };
        
        valueA = getTimestampValue(valueA);
        valueB = getTimestampValue(valueB);
      }
      
      // Handle undefined values
      if (valueA === undefined) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined) return direction === 'asc' ? 1 : -1;
      
      // Handle string values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Handle numeric values
      return direction === 'asc' 
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });
  };

  // Update Samsung grouped wallpapers when sort changes
  const updateSortedSamsungGroups = () => {
    const newGrouped: Record<string, Wallpaper[]> = {};
    
    Object.entries(groupedSamsungWallpapers).forEach(([series, wallpapers]) => {
      newGrouped[series] = sortWallpapers(wallpapers, sortField, sortDirection);
    });
    
    return newGrouped;
  };

  // Update trending grouped wallpapers when sort changes
  const updateSortedTrendingGroups = () => {
    const newGrouped: Record<string, Wallpaper[]> = {};
    
    Object.entries(groupedTrendingWallpapers).forEach(([category, wallpapers]) => {
      newGrouped[category] = sortWallpapers(wallpapers, sortField, sortDirection);
    });
    
    return newGrouped;
  };

  // Get filtered and sorted wallpapers
  const getFilteredTrendingWallpapers = () => {
    let filtered = trendingWallpapers;
    if (selectedTrendingCategory !== 'all') {
      filtered = trendingWallpapers.filter(wallpaper => 
        wallpaper.data.category === selectedTrendingCategory
      );
    }
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  const getFilteredSamsungWallpapers = () => {
    let filtered = samsungWallpapers;
    if (selectedSamsungSeries !== 'all') {
      filtered = samsungWallpapers.filter(wallpaper => 
        wallpaper.data.series === selectedSamsungSeries
      );
    }
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  const getFilteredAppleWallpapers = () => {
    let filtered = appleWallpapers;
    if (selectedAppleSeries !== 'all') {
      filtered = appleWallpapers.filter(wallpaper => 
        wallpaper.data.series === selectedAppleSeries
      );
    }
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  const getFilteredOneplusWallpapers = () => {
    let filtered = oneplusWallpapers;
    if (selectedOneplusSeries !== 'all') {
      filtered = oneplusWallpapers.filter(wallpaper => 
        wallpaper.data.series === selectedOneplusSeries
      );
    }
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  const sortedTrendingWallpapers = getFilteredTrendingWallpapers();
  const sortedSamsungWallpapers = getFilteredSamsungWallpapers();
  const sortedAppleWallpapers = getFilteredAppleWallpapers();
  const sortedOneplusWallpapers = getFilteredOneplusWallpapers();

  // Get unique categories and series for filter options
  const trendingCategories = React.useMemo(() => {
    const categories = new Set<string>();
    trendingWallpapers.forEach(wallpaper => {
      if (wallpaper.data.category) {
        categories.add(wallpaper.data.category);
      }
    });
    return Array.from(categories).sort();
  }, [trendingWallpapers]);

  const samsungSeries = React.useMemo(() => {
    const series = new Set<string>();
    samsungWallpapers.forEach(wallpaper => {
      if (wallpaper.data.series) {
        series.add(wallpaper.data.series);
      }
    });
    return Array.from(series).sort();
  }, [samsungWallpapers]);

  const appleSeries = React.useMemo(() => {
    const series = new Set<string>();
    appleWallpapers.forEach(wallpaper => {
      if (wallpaper.data.series) {
        series.add(wallpaper.data.series);
      }
    });
    return Array.from(series).sort();
  }, [appleWallpapers]);

  const oneplusSeries = React.useMemo(() => {
    const series = new Set<string>();
    oneplusWallpapers.forEach(wallpaper => {
      if (wallpaper.data.series) {
        series.add(wallpaper.data.series);
      }
    });
    return Array.from(series).sort();
  }, [oneplusWallpapers]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle delete all wallpapers in category
  const handleDeleteAllWallpapers = async (activeTab: string) => {
    const categoryName = activeTab === 'trending' 
      ? selectedTrendingCategory 
      : activeTab === 'samsung' 
        ? selectedSamsungSeries 
        : activeTab === 'apple'
          ? selectedAppleSeries
          : selectedOneplusSeries;
    const collectionName = activeTab === 'trending' 
      ? 'TrendingWallpapers' 
      : activeTab === 'samsung' 
        ? 'Samsung' 
        : activeTab === 'apple'
          ? 'Apple'
          : 'OnePlus';
    
    if (!categoryName || categoryName === 'all') return;
    
    const confirmMessage = `Are you sure you want to delete ALL wallpapers in "${categoryName}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteWallpapersByCategory(collectionName, categoryName);
        
        // Refresh the data
        if (activeTab === 'trending') {
          const trendingData = await getAllTrendingWallpapers();
          setTrendingWallpapers(trendingData);
        } else if (activeTab === 'samsung') {
          const samsungData = await getAllWallpapersForBrand('Samsung');
          setSamsungWallpapers(samsungData);
        } else if (activeTab === 'apple') {
          const appleData = await getAllWallpapersForBrand('Apple');
          setAppleWallpapers(appleData);
        } else if (activeTab === 'oneplus') {
          const oneplusData = await getAllWallpapersForBrand('OnePlus');
          setOneplusWallpapers(oneplusData);
        }
        
        alert(`All wallpapers in "${categoryName}" have been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting wallpapers:', error);
        alert('Error deleting wallpapers. Please try again.');
      }
    }
  };

  // Render the sort and filter controls
  const renderControls = (activeTab: string) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
      {/* Sort Controls */}
      <Select
        value={sortField}
        onValueChange={(value) => setSortField(value as SortField)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="timestamp">Date</SelectItem>
          <SelectItem value="views">Views</SelectItem>
          <SelectItem value="downloads">Downloads</SelectItem>
          <SelectItem value="wallpaperName">Name</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortDirection}
        className="h-10 w-10"
      >
        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
      </Button>

      {/* Filter Controls */}
      {activeTab === 'trending' && (
        <Select
          value={selectedTrendingCategory}
          onValueChange={setSelectedTrendingCategory}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {trendingCategories.length === 0 ? (
              <SelectItem value="no-categories" disabled>
                No categories available
              </SelectItem>
            ) : (
              trendingCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {activeTab === 'samsung' && (
        <Select
          value={selectedSamsungSeries}
          onValueChange={setSelectedSamsungSeries}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {samsungSeries.length === 0 ? (
              <SelectItem value="no-series" disabled>
                No series available
              </SelectItem>
            ) : (
              samsungSeries.map(series => (
                <SelectItem key={series} value={series}>
                  {series}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {activeTab === 'apple' && (
        <Select
          value={selectedAppleSeries}
          onValueChange={setSelectedAppleSeries}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {appleSeries.length === 0 ? (
              <SelectItem value="no-series" disabled>
                No series available
              </SelectItem>
            ) : (
              appleSeries.map(series => (
                <SelectItem key={series} value={series}>
                  {series}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {activeTab === 'oneplus' && (
        <Select
          value={selectedOneplusSeries}
          onValueChange={setSelectedOneplusSeries}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {oneplusSeries.length === 0 ? (
              <SelectItem value="no-series" disabled>
                No series available
              </SelectItem>
            ) : (
              oneplusSeries.map(series => (
                <SelectItem key={series} value={series}>
                  {series}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      </div>

      {/* Delete All Button */}
      {((activeTab === 'trending' && selectedTrendingCategory !== 'all') || 
        (activeTab === 'samsung' && selectedSamsungSeries !== 'all') ||
        (activeTab === 'apple' && selectedAppleSeries !== 'all') ||
        (activeTab === 'oneplus' && selectedOneplusSeries !== 'all')) && (
        <Button
          variant="destructive"
          onClick={() => handleDeleteAllWallpapers(activeTab)}
          className="flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete All in {activeTab === 'trending' 
            ? selectedTrendingCategory 
            : activeTab === 'samsung' 
              ? selectedSamsungSeries 
              : activeTab === 'apple'
                ? selectedAppleSeries
                : selectedOneplusSeries}</span>
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8 animate-fade-in">Edit Wallpapers</h1>
      
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="trending">
            Trending Wallpapers ({sortedTrendingWallpapers.length})
          </TabsTrigger>
          <TabsTrigger value="samsung">
            Samsung Wallpapers ({sortedSamsungWallpapers.length})
          </TabsTrigger>
          <TabsTrigger value="apple">
            Apple Wallpapers ({sortedAppleWallpapers.length})
          </TabsTrigger>
          <TabsTrigger value="oneplus">
            OnePlus Wallpapers ({sortedOneplusWallpapers.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending">
          {renderControls('trending')}
          {loadingTrending ? (
            <Card className="w-full p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : sortedTrendingWallpapers.length > 0 ? (
            <div className="max-w-full mx-auto">
              <WallpaperGrid 
                wallpapers={sortedTrendingWallpapers} 
                collection="TrendingWallpapers"
                onWallpaperUpdated={(updatedWallpapers) => setTrendingWallpapers(updatedWallpapers)}
                onWallpaperDeleted={() => {
                  // Refresh the trending wallpapers
                  getAllTrendingWallpapers().then(data => setTrendingWallpapers(data));
                }}
                gridColumns={5}
                useThumbnails={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {selectedTrendingCategory === 'all' 
                  ? "No trending wallpapers found."
                  : `No wallpapers found in "${selectedTrendingCategory}" category.`
                }
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="samsung">
          {renderControls('samsung')}
          {loadingSamsung ? (
            <Card className="w-full p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : sortedSamsungWallpapers.length > 0 ? (
            <div className="max-w-full mx-auto">
              <WallpaperGrid 
                wallpapers={sortedSamsungWallpapers} 
                collection="Samsung"
                onWallpaperUpdated={(updatedWallpapers) => {
                  // Update both the full list and the grouped list
                  getAllWallpapersForBrand('Samsung').then(data => {
                    setSamsungWallpapers(data);
                  });
                }}
                onWallpaperDeleted={() => {
                  // Refresh the Samsung wallpapers
                  getAllWallpapersForBrand('Samsung').then(data => {
                    setSamsungWallpapers(data);
                  });
                }}
                gridColumns={5}
                useThumbnails={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {selectedSamsungSeries === 'all' 
                  ? "No Samsung wallpapers found."
                  : `No wallpapers found in "${selectedSamsungSeries}" series.`
                }
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apple">
          {renderControls('apple')}
          {loadingApple ? (
            <Card className="w-full p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : sortedAppleWallpapers.length > 0 ? (
            <div className="max-w-full mx-auto">
              <WallpaperGrid 
                wallpapers={sortedAppleWallpapers} 
                collection="Apple"
                onWallpaperUpdated={(updatedWallpapers) => {
                  // Update both the full list and the grouped list
                  getAllWallpapersForBrand('Apple').then(data => {
                    setAppleWallpapers(data);
                  });
                }}
                onWallpaperDeleted={() => {
                  // Refresh the Apple wallpapers
                  getAllWallpapersForBrand('Apple').then(data => {
                    setAppleWallpapers(data);
                  });
                }}
                gridColumns={5}
                useThumbnails={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {selectedAppleSeries === 'all' 
                  ? "No Apple wallpapers found."
                  : `No wallpapers found in "${selectedAppleSeries}" series.`
                }
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="oneplus">
          {renderControls('oneplus')}
          {loadingOneplus ? (
            <Card className="w-full p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : sortedOneplusWallpapers.length > 0 ? (
            <div className="max-w-full mx-auto">
              <WallpaperGrid 
                wallpapers={sortedOneplusWallpapers} 
                collection="OnePlus"
                onWallpaperUpdated={(updatedWallpapers) => {
                  // Update both the full list and the grouped list
                  getAllWallpapersForBrand('OnePlus').then(data => {
                    setOneplusWallpapers(data);
                  });
                }}
                onWallpaperDeleted={() => {
                  // Refresh the OnePlus wallpapers
                  getAllWallpapersForBrand('OnePlus').then(data => {
                    setOneplusWallpapers(data);
                  });
                }}
                gridColumns={5}
                useThumbnails={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {selectedOneplusSeries === 'all' 
                  ? "No OnePlus wallpapers found."
                  : `No wallpapers found in "${selectedOneplusSeries}" series.`
                }
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default EditWallpaper;
