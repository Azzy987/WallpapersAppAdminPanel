
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WallpaperGrid from '@/components/wallpaper/WallpaperGrid';
import { 
  getAllTrendingWallpapers, 
  getAllWallpapersForBrand,
  getBrandCategories,
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

const TRENDING_TAB = 'trending';

/** Tab id for a brand, e.g. "OnePlus" -> "oneplus" */
const brandTabId = (brand: string) => brand.toLowerCase().replace(/[^a-z0-9]/g, '');

const EditWallpaper = () => {
  const [trendingWallpapers, setTrendingWallpapers] = useState<Wallpaper[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [groupedTrendingWallpapers, setGroupedTrendingWallpapers] = useState<Record<string, Wallpaper[]>>({});

  // Brand tabs are driven by the brand categories in Firestore, so a newly
  // created brand shows up without a code change.
  const [brands, setBrands] = useState<string[]>([]);
  const [brandWallpapers, setBrandWallpapers] = useState<Record<string, Wallpaper[]>>({});
  const [loadingBrands, setLoadingBrands] = useState<Record<string, boolean>>({});
  const [selectedBrandSeries, setSelectedBrandSeries] = useState<Record<string, string>>({});

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter states
  const [selectedTrendingCategory, setSelectedTrendingCategory] = useState<string>('all');
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
      } catch (error) {
        console.error('Error fetching trending wallpapers:', error);
      } finally {
        setLoadingTrending(false);
      }

      try {
        // Brand tabs come from the brand categories, so new brands appear here
        const brandNames = await getBrandCategories();
        setBrands(brandNames);
        setLoadingBrands(Object.fromEntries(brandNames.map(b => [b, true])));

        // Load each brand independently so one slow or missing collection does
        // not hold up the rest
        await Promise.all(
          brandNames.map(async brand => {
            try {
              const data = await getAllWallpapersForBrand(brand);
              setBrandWallpapers(prev => ({ ...prev, [brand]: data }));
            } catch (error) {
              console.error(`Error fetching ${brand} wallpapers:`, error);
              setBrandWallpapers(prev => ({ ...prev, [brand]: [] }));
            } finally {
              setLoadingBrands(prev => ({ ...prev, [brand]: false }));
            }
          })
        );
      } catch (error) {
        console.error('Error fetching brand categories:', error);
        setLoadingBrands({});
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

  const getFilteredWallpapersForBrand = (brand: string) => {
    const all = brandWallpapers[brand] ?? [];
    const series = selectedBrandSeries[brand] ?? 'all';
    const filtered = series === 'all'
      ? all
      : all.filter(wallpaper => wallpaper.data.series === series);
    return sortWallpapers(filtered, sortField, sortDirection);
  };

  /** Map a tab id back to the brand it represents, or null for trending */
  const brandForTab = (activeTab: string) =>
    brands.find(brand => brandTabId(brand) === activeTab) ?? null;

  const getCollectionNameForTab = (activeTab: string) => {
    if (activeTab === TRENDING_TAB) return 'TrendingWallpapers';
    return brandForTab(activeTab) ?? '';
  };

  const getFilteredWallpapersForTab = (activeTab: string) => {
    if (activeTab === TRENDING_TAB) return getFilteredTrendingWallpapers();
    const brand = brandForTab(activeTab);
    return brand ? getFilteredWallpapersForBrand(brand) : [];
  };

  const getAllWallpapersForTab = (activeTab: string) => {
    if (activeTab === TRENDING_TAB) return trendingWallpapers;
    const brand = brandForTab(activeTab);
    return brand ? (brandWallpapers[brand] ?? []) : [];
  };

  const refreshWallpapersForTab = async (activeTab: string) => {
    if (activeTab === TRENDING_TAB) {
      setTrendingWallpapers(await getAllTrendingWallpapers());
      return;
    }
    const brand = brandForTab(activeTab);
    if (!brand) return;
    const data = await getAllWallpapersForBrand(brand);
    setBrandWallpapers(prev => ({ ...prev, [brand]: data }));
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

  // Get unique categories for the trending filter
  const trendingCategories = React.useMemo(() => {
    const categories = new Set<string>();
    trendingWallpapers.forEach(wallpaper => {
      if (wallpaper.data.category) {
        categories.add(wallpaper.data.category);
      }
    });
    return Array.from(categories).sort();
  }, [trendingWallpapers]);

  // Unique series per brand, for the per-brand filters
  const brandSeries = React.useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const brand of brands) {
      const series = new Set<string>();
      (brandWallpapers[brand] ?? []).forEach(wallpaper => {
        if (wallpaper.data.series) {
          series.add(wallpaper.data.series);
        }
      });
      result[brand] = Array.from(series).sort();
    }
    return result;
  }, [brands, brandWallpapers]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle delete all wallpapers in category
  const handleDeleteAllWallpapers = async (activeTab: string) => {
    const brand = brandForTab(activeTab);
    const categoryName = activeTab === TRENDING_TAB
      ? selectedTrendingCategory
      : (brand ? (selectedBrandSeries[brand] ?? 'all') : 'all');
    const collectionName = getCollectionNameForTab(activeTab);

    if (!categoryName || categoryName === 'all' || !collectionName) return;

    const confirmMessage = `Are you sure you want to delete ALL wallpapers in "${categoryName}"? This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteWallpapersByCategory(collectionName, categoryName);

        // Refresh the data
        await refreshWallpapersForTab(activeTab);

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

      {brandForTab(activeTab) && (() => {
        const brand = brandForTab(activeTab) as string;
        const series = brandSeries[brand] ?? [];
        return (
          <Select
            value={selectedBrandSeries[brand] ?? 'all'}
            onValueChange={value =>
              setSelectedBrandSeries(prev => ({ ...prev, [brand]: value }))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
              {series.length === 0 ? (
                <SelectItem value="no-series" disabled>
                  No series available
                </SelectItem>
              ) : (
                series.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        );
      })()}
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
        {(() => {
          const brand = brandForTab(activeTab);
          const activeFilter = activeTab === TRENDING_TAB
            ? selectedTrendingCategory
            : (brand ? (selectedBrandSeries[brand] ?? 'all') : 'all');
          if (activeFilter === 'all') return null;
          return (
            <Button
              variant="destructive"
              onClick={() => handleDeleteAllWallpapers(activeTab)}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All in {activeFilter}</span>
            </Button>
          );
        })()}
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
      
      <Tabs defaultValue={TRENDING_TAB} className="w-full">
        {/* h-auto + flex-wrap so many brands wrap onto extra rows instead of
            overflowing a single fixed-height row */}
        <TabsList className="mb-6 flex flex-wrap h-auto w-full justify-start gap-1">
          <TabsTrigger value={TRENDING_TAB}>
            Trending Wallpapers ({sortedTrendingWallpapers.length})
          </TabsTrigger>
          {brands.map(brand => (
            <TabsTrigger key={brand} value={brandTabId(brand)}>
              {brand} Wallpapers ({getFilteredWallpapersForBrand(brand).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TRENDING_TAB}>
          {renderControls(TRENDING_TAB)}
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

        {brands.map(brand => {
          const tabId = brandTabId(brand);
          const wallpapers = getFilteredWallpapersForBrand(brand);
          const activeSeries = selectedBrandSeries[brand] ?? 'all';
          return (
            <TabsContent key={brand} value={tabId}>
              {renderControls(tabId)}
              {loadingBrands[brand] ? (
                <Card className="w-full p-8 flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
              ) : wallpapers.length > 0 ? (
                <div className="max-w-full mx-auto">
                  <WallpaperGrid
                    wallpapers={wallpapers}
                    collection={brand}
                    onWallpaperUpdated={() => {
                      getAllWallpapersForBrand(brand).then(data => {
                        setBrandWallpapers(prev => ({ ...prev, [brand]: data }));
                      });
                    }}
                    onWallpaperDeleted={() => {
                      getAllWallpapersForBrand(brand).then(data => {
                        setBrandWallpapers(prev => ({ ...prev, [brand]: data }));
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
                    {activeSeries === 'all'
                      ? `No ${brand} wallpapers found.`
                      : `No wallpapers found in "${activeSeries}" series.`
                    }
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </Layout>
  );
};

export default EditWallpaper;
