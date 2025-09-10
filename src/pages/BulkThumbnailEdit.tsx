import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { getTrendingWallpapers, getSamsungWallpapers, updateWallpaperInCollection } from '@/lib/firebase';

interface ThumbnailSize {
  label: string;
  value: string;
  width: number;
  height: number;
  description: string;
}

interface BulkEditProgress {
  total: number;
  completed: number;
  failed: number;
  currentItem: string;
  errors: string[];
}

const THUMBNAIL_SIZES: ThumbnailSize[] = [
  {
    label: 'Current (360x640)',
    value: '360x640',
    width: 360,
    height: 640,
    description: 'Current thumbnail size'
  },
  {
    label: 'High Quality (480x854)',
    value: '480x854',
    width: 480,
    height: 854,
    description: 'Higher quality for better devices'
  },
  {
    label: 'Ultra Quality (540x960)',
    value: '540x960',
    width: 540,
    height: 960,
    description: 'Ultra high quality'
  },
  {
    label: 'Maximum (720x1280)',
    value: '720x1280',
    width: 720,
    height: 1280,
    description: 'Maximum quality (larger file size)'
  }
];

const COLLECTIONS = [
  {
    id: 'trending',
    name: 'TrendingWallpapers',
    description: 'Popular and trending wallpapers',
    fetchFunction: getTrendingWallpapers
  },
  {
    id: 'samsung',
    name: 'Samsung',
    description: 'Samsung device wallpapers',
    fetchFunction: getSamsungWallpapers
  }
];

const BulkThumbnailEdit: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wallpapers, setWallpapers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<BulkEditProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    currentItem: '',
    errors: []
  });

  // Load wallpapers for selected collection
  const loadWallpapers = async () => {
    if (!selectedCollection) return;

    setIsLoading(true);
    try {
      const collection = COLLECTIONS.find(c => c.id === selectedCollection);
      if (!collection) {
        toast.error('Collection not found');
        return;
      }

      console.log(`📁 Loading wallpapers from ${collection.name}...`);
      const data = await collection.fetchFunction();
      
      setWallpapers(data);
      toast.success(`Loaded ${data.length} wallpapers from ${collection.name}`);
      
      console.log(`📊 Collection stats:`, {
        collection: collection.name,
        count: data.length,
        sampleUrls: data.slice(0, 3).map(w => w.imageUrl || w.wallpaperUrl)
      });
      
    } catch (error) {
      console.error('Error loading wallpapers:', error);
      toast.error('Failed to load wallpapers');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new thumbnail URL with selected size
  const generateThumbnailUrl = (originalUrl: string, newSize: string): string => {
    if (!originalUrl) return originalUrl;

    console.log(`🔄 Generating thumbnail URL:`, { originalUrl, newSize });

    // Check if it's a CloudFront URL
    if (originalUrl.includes('d1wqpnbk3wcub7.cloudfront.net')) {
      const baseUrl = 'https://d1wqpnbk3wcub7.cloudfront.net';
      // Remove any existing fit-in transformation
      const imagePath = originalUrl.substring(originalUrl.indexOf('cloudfront.net/') + 15)
        .replace(/^\/?(fit-in\/\d+x\d+\/)?/, '');
      
      const newUrl = `${baseUrl}/fit-in/${newSize}/${imagePath}`;
      console.log(`✅ Generated CloudFront URL:`, newUrl);
      return newUrl;
    }

    // For non-CloudFront URLs, return as-is (shouldn't happen in normal flow)
    console.warn('⚠️ Non-CloudFront URL detected:', originalUrl);
    return originalUrl;
  };

  // Bulk update thumbnails
  const updateThumbnails = async () => {
    if (!selectedCollection || !selectedSize || wallpapers.length === 0) {
      toast.error('Please select collection, size, and load wallpapers first');
      return;
    }

    const selectedSizeInfo = THUMBNAIL_SIZES.find(s => s.value === selectedSize);
    if (!selectedSizeInfo) {
      toast.error('Invalid thumbnail size selected');
      return;
    }

    // Confirm the operation
    const confirmed = window.confirm(
      `Are you sure you want to update ${wallpapers.length} wallpaper thumbnails to ${selectedSizeInfo.label}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsUpdating(true);
    setProgress({
      total: wallpapers.length,
      completed: 0,
      failed: 0,
      currentItem: '',
      errors: []
    });

    console.log(`🚀 Starting bulk thumbnail update:`, {
      collection: selectedCollection,
      size: selectedSize,
      count: wallpapers.length
    });

    let completed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Process in batches to avoid overwhelming Firebase
      const BATCH_SIZE = 5;
      for (let i = 0; i < wallpapers.length; i += BATCH_SIZE) {
        const batch = wallpapers.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (wallpaper, batchIndex) => {
          const globalIndex = i + batchIndex;
          const wallpaperName = wallpaper.wallpaperName || wallpaper.name || `Wallpaper ${globalIndex + 1}`;
          
          try {
            setProgress(prev => ({ ...prev, currentItem: wallpaperName }));
            
            // Get the current image URL
            const currentUrl = wallpaper.imageUrl || wallpaper.wallpaperUrl;
            if (!currentUrl) {
              throw new Error('No image URL found');
            }

            // Generate new thumbnail URL
            const newThumbnailUrl = generateThumbnailUrl(currentUrl, selectedSize);
            
            // Update the wallpaper in Firebase
            const collection = COLLECTIONS.find(c => c.id === selectedCollection);
            if (!collection) {
              throw new Error('Collection not found');
            }

            // Determine which field to update based on collection
            const updateData = selectedCollection === 'trending' 
              ? { imageUrl: newThumbnailUrl }
              : { wallpaperUrl: newThumbnailUrl };

            await updateWallpaperInCollection(collection.name, wallpaper.id, updateData);
            
            console.log(`✅ Updated ${wallpaperName}: ${newThumbnailUrl}`);
            completed++;
            
          } catch (error) {
            console.error(`❌ Failed to update ${wallpaperName}:`, error);
            failed++;
            errors.push(`${wallpaperName}: ${error.message}`);
          }
          
          // Update progress
          setProgress(prev => ({
            ...prev,
            completed: completed,
            failed: failed,
            errors: [...errors]
          }));
        });

        // Wait for current batch to complete
        await Promise.allSettled(batchPromises);
        
        // Small delay between batches
        if (i + BATCH_SIZE < wallpapers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final results
      if (failed === 0) {
        toast.success(`🎉 Successfully updated all ${completed} wallpaper thumbnails!`);
      } else {
        toast.warning(`⚠️ Updated ${completed} wallpapers, ${failed} failed. Check details below.`);
      }

      console.log(`📊 Bulk update complete:`, { completed, failed, errors });
      
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Bulk update failed. Check console for details.');
    } finally {
      setIsUpdating(false);
      setProgress(prev => ({ ...prev, currentItem: '' }));
    }
  };

  // Auto-load wallpapers when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadWallpapers();
    }
  }, [selectedCollection]);

  const selectedSizeInfo = THUMBNAIL_SIZES.find(s => s.value === selectedSize);
  const progressPercentage = progress.total > 0 ? Math.round((progress.completed + progress.failed) / progress.total * 100) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Thumbnail Editor</h1>
            <p className="text-gray-600 dark:text-gray-300">Update thumbnail sizes for entire collections at once</p>
          </div>
        </div>

        {/* Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collection Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Collection</label>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection to edit" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTIONS.map(collection => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <div>
                        <div className="font-medium">{collection.name}</div>
                        <div className="text-sm text-gray-500">{collection.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thumbnail Size Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">New Thumbnail Size</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new thumbnail size" />
                </SelectTrigger>
                <SelectContent>
                  {THUMBNAIL_SIZES.map(size => (
                    <SelectItem key={size.value} value={size.value}>
                      <div>
                        <div className="font-medium">{size.label}</div>
                        <div className="text-sm text-gray-500">{size.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={loadWallpapers}
                disabled={!selectedCollection || isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Wallpapers
                  </>
                )}
              </Button>

              <Button 
                onClick={updateThumbnails}
                disabled={!selectedCollection || !selectedSize || wallpapers.length === 0 || isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update All Thumbnails
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Section */}
        {wallpapers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Collection Info */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Collection: {COLLECTIONS.find(c => c.id === selectedCollection)?.name}</div>
                  <div className="text-sm text-gray-500">{wallpapers.length} wallpapers loaded</div>
                </div>
                {selectedSizeInfo && (
                  <Badge variant="outline" className="ml-2">
                    Target: {selectedSizeInfo.label}
                  </Badge>
                )}
              </div>

              {/* Progress */}
              {isUpdating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {progress.completed + progress.failed} / {progress.total}</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                  
                  {progress.currentItem && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Currently updating: {progress.currentItem}
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✅ Completed: {progress.completed}</span>
                    <span className="text-red-600">❌ Failed: {progress.failed}</span>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              {!isUpdating && progress.total > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-medium mb-2">Update Results</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
                      <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                      <div className="text-sm text-gray-500">Failed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {progress.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({progress.errors.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {progress.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 dark:text-red-300 font-mono">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Select a collection (TrendingWallpapers or Samsung)</li>
              <li>Choose the new thumbnail size you want to apply</li>
              <li>Click "Load Wallpapers" to see how many wallpapers will be affected</li>
              <li>Click "Update All Thumbnails" to start the bulk update process</li>
              <li>Monitor the progress and check results when complete</li>
            </ol>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Warning:</strong> This operation will permanently change the thumbnail URLs for all wallpapers in the selected collection. Make sure you have backups if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BulkThumbnailEdit;