
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WallpaperGrid from '@/components/wallpaper/WallpaperGrid';
import { 
  getAllTrendingWallpapers, 
  getAllWallpapersForBrand,
  deleteWallpapersByCategory,
  updateWallpaper,
} from '@/lib/firebase';
import { Loader2, ArrowUpDown, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import {
  buildWallpaperMetadataFromUrl,
  pickDefinedWallpaperMetadata,
} from '@/lib/imageMetadata';

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
  const [xiaomiWallpapers, setXiaomiWallpapers] = useState<Wallpaper[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSamsung, setLoadingSamsung] = useState(true);
  const [loadingApple, setLoadingApple] = useState(true);
  const [loadingOneplus, setLoadingOneplus] = useState(true);
  const [loadingXiaomi, setLoadingXiaomi] = useState(true);
  const [groupedSamsungWallpapers, setGroupedSamsungWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedAppleWallpapers, setGroupedAppleWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedOneplusWallpapers, setGroupedOneplusWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedXiaomiWallpapers, setGroupedXiaomiWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [groupedTrendingWallpapers, setGroupedTrendingWallpapers] = useState<Record<string, Wallpaper[]>>({});
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter states
  const [selectedTrendingCategory, setSelectedTrendingCategory] = useState<string>('all');
  const [selectedSamsungSeries, setSelectedSamsungSeries] = useState<string>('all');
  const [selectedAppleSeries, setSelectedAppleSeries] = useState<string>('all');
  const [selectedOneplusSeries, setSelectedOneplusSeries] = useState<string>('all');
  const [selectedXiaomiSeries, setSelectedXiaomiSeries] = useState<string>('all');
  const [metadataBackfill, setMetadataBackfill] = useState({
    activeTab: '',
    done: 0,
    total: 0,
    running: false,
  });
  const [metadataFailures, setMetadataFailures] = useState<Array<{
    id: string;
    name?: string;
    imageUrl?: string;
    error: string;
  }>>([]);
  const [metadataUrlFix, setMetadataUrlFix] = useState({
    url: '',
    running: false,
    result: '',
  });

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

        // Fetch Xiaomi wallpapers
        setLoadingXiaomi(true);
        const xiaomiData = await getAllWallpapersForBrand('Xiaomi');
        setXiaomiWallpapers(xiaomiData);

        // Group Xiaomi wallpapers by series
        const xiaomiGrouped = xiaomiData.reduce((acc: Record<string, Wallpaper[]>, wallpaper) => {
          const series = wallpaper.data.series || 'Other';
          if (!acc[series]) {
            acc[series] = [];
          }
          acc[series].push(wallpaper);
          return acc;
        }, {});
        setGroupedXiaomiWallpapers(xiaomiGrouped);
        setLoadingXiaomi(false);
      } catch (error) {
        console.error('Error fetching wallpapers:', error);
        setLoadingTrending(false);
        setLoadingSamsung(false);
        setLoadingApple(false);
        setLoadingOneplus(false);
        setLoadingXiaomi(false);
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

  const getFilteredXiaomiWallpapers = () => {
    let filtered = xiaomiWallpapers;
    if (selectedXiaomiSeries !== 'all') {
      filtered = xiaomiWallpapers.filter(wallpaper =>
        wallpaper.data.series === selectedXiaomiSeries
      );
    }
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  const getCollectionNameForTab = (activeTab: string) => {
    if (activeTab === 'trending') return 'TrendingWallpapers';
    if (activeTab === 'samsung') return 'Samsung';
    if (activeTab === 'apple') return 'Apple';
    if (activeTab === 'oneplus') return 'OnePlus';
    return 'Xiaomi';
  };

  const getFilteredWallpapersForTab = (activeTab: string) => {
    if (activeTab === 'trending') return getFilteredTrendingWallpapers();
    if (activeTab === 'samsung') return getFilteredSamsungWallpapers();
    if (activeTab === 'apple') return getFilteredAppleWallpapers();
    if (activeTab === 'oneplus') return getFilteredOneplusWallpapers();
    return getFilteredXiaomiWallpapers();
  };

  const getAllWallpapersForTab = (activeTab: string) => {
    if (activeTab === 'trending') return trendingWallpapers;
    if (activeTab === 'samsung') return samsungWallpapers;
    if (activeTab === 'apple') return appleWallpapers;
    if (activeTab === 'oneplus') return oneplusWallpapers;
    return xiaomiWallpapers;
  };

  const refreshWallpapersForTab = async (activeTab: string) => {
    if (activeTab === 'trending') {
      setTrendingWallpapers(await getAllTrendingWallpapers());
    } else if (activeTab === 'samsung') {
      setSamsungWallpapers(await getAllWallpapersForBrand('Samsung'));
    } else if (activeTab === 'apple') {
      setAppleWallpapers(await getAllWallpapersForBrand('Apple'));
    } else if (activeTab === 'oneplus') {
      setOneplusWallpapers(await getAllWallpapersForBrand('OnePlus'));
    } else if (activeTab === 'xiaomi') {
      setXiaomiWallpapers(await getAllWallpapersForBrand('Xiaomi'));
    }
  };

  const handleBackfillMetadata = async (activeTab: string) => {
    const collectionName = getCollectionNameForTab(activeTab);
    const targets = getFilteredWallpapersForTab(activeTab);
    setMetadataFailures([]);

    if (targets.length === 0) {
      toast.info('No visible wallpapers to scan');
      return;
    }

    setMetadataBackfill({
      activeTab,
      done: 0,
      total: targets.length,
      running: true,
    });

    let updatedCount = 0;
    const failedWallpapers: Array<{ wallpaper: Wallpaper; error: string }> = [];
    const finalFailedItems: Array<{ id: string; name?: string; imageUrl?: string; error: string }> = [];
    const BATCH_SIZE = 5;

    try {
      const writeMetadataForWallpaper = async (wallpaper: Wallpaper) => {
        const metadata = await buildWallpaperMetadataFromUrl(wallpaper.data.imageUrl);
        const updateData = pickDefinedWallpaperMetadata(metadata);

        if (!updateData.size || !updateData.dimensions) {
          throw new Error(`Incomplete metadata: ${JSON.stringify(updateData)}`);
        }

        await updateWallpaper(collectionName, wallpaper.id, updateData);
      };

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (wallpaper) => {
            try {
              await writeMetadataForWallpaper(wallpaper);
            } catch (error) {
              failedWallpapers.push({
                wallpaper,
                error: error instanceof Error ? error.message : String(error),
              });
              throw error;
            }
          })
        );

        updatedCount += results.filter(result => result.status === 'fulfilled').length;
        setMetadataBackfill(prev => ({
          ...prev,
          done: Math.min(prev.done + batch.length, targets.length),
        }));
      }

      if (failedWallpapers.length > 0) {
        toast.info(`Retrying ${failedWallpapers.length} failed item(s) one by one`);
        setMetadataBackfill(prev => ({
          ...prev,
          total: targets.length + failedWallpapers.length,
        }));

        for (let i = 0; i < failedWallpapers.length; i++) {
          const { wallpaper, error: firstError } = failedWallpapers[i];

          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            await writeMetadataForWallpaper(wallpaper);
            updatedCount++;
          } catch (error) {
            finalFailedItems.push({
              id: wallpaper.id,
              name: wallpaper.data.wallpaperName,
              imageUrl: wallpaper.data.imageUrl,
              error: `${firstError}; retry: ${error instanceof Error ? error.message : String(error)}`,
            });
          }

          setMetadataBackfill(prev => ({
            ...prev,
            done: Math.min(targets.length + i + 1, targets.length + failedWallpapers.length),
          }));
        }
      }

      await refreshWallpapersForTab(activeTab);

      if (finalFailedItems.length > 0) {
        console.table(finalFailedItems);
        setMetadataFailures(finalFailedItems);
      } else {
        setMetadataFailures([]);
      }

      if (finalFailedItems.length > 0) {
        toast.warning(`Metadata force-written for ${updatedCount} wallpaper(s), ${finalFailedItems.length} failed after retry.`);
      } else {
        toast.success(`Metadata force-written for ${updatedCount} wallpaper(s)`);
      }
    } catch (error) {
      console.error('Error backfilling wallpaper metadata:', error);
      toast.error('Failed to generate metadata');
    } finally {
      setMetadataBackfill({
        activeTab: '',
        done: 0,
        total: 0,
        running: false,
      });
    }
  };

  const handleFixMetadataForUrl = async (activeTab: string) => {
    const url = metadataUrlFix.url.trim();
    if (!url) {
      toast.error('Paste an image URL first');
      return;
    }

    const collectionName = getCollectionNameForTab(activeTab);
    const matches = getAllWallpapersForTab(activeTab).filter(wallpaper => {
      return wallpaper.data.imageUrl === url;
    });

    if (matches.length === 0) {
      const fuzzyMatches = getAllWallpapersForTab(activeTab).filter(wallpaper => {
        return wallpaper.data.imageUrl?.includes(url) || url.includes(wallpaper.data.imageUrl);
      });
      setMetadataUrlFix(prev => ({
        ...prev,
        result: fuzzyMatches.length > 0
          ? `No exact match found. ${fuzzyMatches.length} partial match(es) exist; check for transformed/query URL differences.`
          : 'No matching imageUrl found in this tab collection.',
      }));
      toast.error('No exact imageUrl match found in this tab');
      return;
    }

    setMetadataUrlFix(prev => ({ ...prev, running: true, result: '' }));

    try {
      const metadata = pickDefinedWallpaperMetadata(await buildWallpaperMetadataFromUrl(url));
      if (!metadata.size || !metadata.dimensions) {
        throw new Error(`Incomplete metadata: ${JSON.stringify(metadata)}`);
      }

      await Promise.all(matches.map(match => updateWallpaper(collectionName, match.id, metadata)));
      await refreshWallpapersForTab(activeTab);

      const ids = matches.map(match => match.id).join(', ');
      const result = `Wrote ${metadata.size}, ${metadata.dimensions} to ${matches.length} doc(s): ${ids}`;
      setMetadataUrlFix(prev => ({ ...prev, result }));
      toast.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMetadataUrlFix(prev => ({ ...prev, result: `Failed: ${message}` }));
      toast.error(`URL metadata fix failed: ${message}`);
    } finally {
      setMetadataUrlFix(prev => ({ ...prev, running: false }));
    }
  };

  const sortedTrendingWallpapers = getFilteredTrendingWallpapers();
  const sortedSamsungWallpapers = getFilteredSamsungWallpapers();
  const sortedAppleWallpapers = getFilteredAppleWallpapers();
  const sortedOneplusWallpapers = getFilteredOneplusWallpapers();
  const sortedXiaomiWallpapers = getFilteredXiaomiWallpapers();

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

  const xiaomiSeries = React.useMemo(() => {
    const series = new Set<string>();
    xiaomiWallpapers.forEach(wallpaper => {
      if (wallpaper.data.series) {
        series.add(wallpaper.data.series);
      }
    });
    return Array.from(series).sort();
  }, [xiaomiWallpapers]);

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
          : activeTab === 'oneplus'
            ? selectedOneplusSeries
            : selectedXiaomiSeries;
    const collectionName = activeTab === 'trending'
      ? 'TrendingWallpapers'
      : activeTab === 'samsung'
        ? 'Samsung'
        : activeTab === 'apple'
          ? 'Apple'
          : activeTab === 'oneplus'
            ? 'OnePlus'
            : 'Xiaomi';
    
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
        } else if (activeTab === 'xiaomi') {
          const xiaomiData = await getAllWallpapersForBrand('Xiaomi');
          setXiaomiWallpapers(xiaomiData);
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
    <div className="mb-4 space-y-3">
    <div className="flex items-center justify-between">
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

      {activeTab === 'xiaomi' && (
        <Select
          value={selectedXiaomiSeries}
          onValueChange={setSelectedXiaomiSeries}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {xiaomiSeries.length === 0 ? (
              <SelectItem value="no-series" disabled>
                No series available
              </SelectItem>
            ) : (
              xiaomiSeries.map(series => (
                <SelectItem key={series} value={series}>
                  {series}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => handleBackfillMetadata(activeTab)}
          disabled={metadataBackfill.running}
          className="flex items-center space-x-2"
        >
          {metadataBackfill.running && metadataBackfill.activeTab === activeTab ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Generate Size &amp; Dimensions</span>
        </Button>

        {/* Delete All Button */}
        {((activeTab === 'trending' && selectedTrendingCategory !== 'all') ||
          (activeTab === 'samsung' && selectedSamsungSeries !== 'all') ||
          (activeTab === 'apple' && selectedAppleSeries !== 'all') ||
          (activeTab === 'oneplus' && selectedOneplusSeries !== 'all') ||
          (activeTab === 'xiaomi' && selectedXiaomiSeries !== 'all')) && (
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
                  : activeTab === 'oneplus'
                    ? selectedOneplusSeries
                    : selectedXiaomiSeries}</span>
          </Button>
        )}
      </div>
    </div>

    {metadataBackfill.running && metadataBackfill.activeTab === activeTab && (
      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Generating metadata {metadataBackfill.done} / {metadataBackfill.total}
      </div>
    )}

    {metadataFailures.length > 0 && (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <div className="font-medium text-destructive mb-2">
          {metadataFailures.length} metadata item{metadataFailures.length === 1 ? '' : 's'} failed
        </div>
        <div className="space-y-2">
          {metadataFailures.map((failure) => (
            <div key={failure.id} className="rounded bg-background/80 p-2">
              <div className="font-medium">{failure.name || 'Untitled wallpaper'}</div>
              <div className="text-xs text-muted-foreground break-all">ID: {failure.id}</div>
              <div className="text-xs text-muted-foreground break-all">URL: {failure.imageUrl || 'Missing imageUrl'}</div>
              <div className="text-xs text-destructive break-all">Error: {failure.error}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm">
      <div className="mb-2 font-medium">Fix one exact imageUrl</div>
      <div className="flex flex-col gap-2 lg:flex-row">
        <Input
          value={metadataUrlFix.url}
          onChange={(event) => setMetadataUrlFix(prev => ({ ...prev, url: event.target.value }))}
          placeholder="Paste exact imageUrl from Firestore"
          className="font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => handleFixMetadataForUrl(activeTab)}
          disabled={metadataUrlFix.running}
          className="lg:w-auto"
        >
          {metadataUrlFix.running ? 'Fixing...' : 'Force Fix URL'}
        </Button>
      </div>
      {metadataUrlFix.result && (
        <div className="mt-2 text-xs text-muted-foreground break-all">
          {metadataUrlFix.result}
        </div>
      )}
    </div>
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
          <TabsTrigger value="xiaomi">
            Xiaomi Wallpapers ({sortedXiaomiWallpapers.length})
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
                gridColumns={6}
                useThumbnails={true}
                initialVisibleCount={10}
                loadMoreCount={10}
                compact={true}
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
                gridColumns={6}
                useThumbnails={true}
                initialVisibleCount={10}
                loadMoreCount={10}
                compact={true}
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
                gridColumns={6}
                useThumbnails={true}
                initialVisibleCount={10}
                loadMoreCount={10}
                compact={true}
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
                gridColumns={6}
                useThumbnails={true}
                initialVisibleCount={10}
                loadMoreCount={10}
                compact={true}
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

        <TabsContent value="xiaomi">
          {renderControls('xiaomi')}
          {loadingXiaomi ? (
            <Card className="w-full p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : sortedXiaomiWallpapers.length > 0 ? (
            <div className="max-w-full mx-auto">
              <WallpaperGrid
                wallpapers={sortedXiaomiWallpapers}
                collection="Xiaomi"
                onWallpaperUpdated={(updatedWallpapers) => {
                  // Update both the full list and the grouped list
                  getAllWallpapersForBrand('Xiaomi').then(data => {
                    setXiaomiWallpapers(data);
                  });
                }}
                onWallpaperDeleted={() => {
                  // Refresh the Xiaomi wallpapers
                  getAllWallpapersForBrand('Xiaomi').then(data => {
                    setXiaomiWallpapers(data);
                  });
                }}
                gridColumns={6}
                useThumbnails={true}
                initialVisibleCount={10}
                loadMoreCount={10}
                compact={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {selectedXiaomiSeries === 'all'
                  ? "No Xiaomi wallpapers found."
                  : `No wallpapers found in "${selectedXiaomiSeries}" series.`
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
