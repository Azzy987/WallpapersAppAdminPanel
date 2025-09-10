import React, { useState, useEffect } from 'react';
import { 
  addTrendingWallpaperWithId,
  addBrandWallpaperWithId,
  addBannerWithId,
  getCategories, 
  getDevices,
  checkDuplicateWallpaper,
  Category,
  Device,
  samsungDeviceYearMap
} from '@/lib/firebase';
import { toast } from 'sonner';
import CategoryDialog from './CategoryDialog';
import WallpaperFormHeader from './FormComponents/WallpaperFormHeader';
import WallpaperFormItem from './FormComponents/WallpaperFormItem';
import SubmitButton from './FormComponents/SubmitButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';

interface WallpaperForm {
  imageUrl: string;
  wallpaperName: string;
  source: string;
  exclusive: boolean;
  addAsBanner: boolean;
  depthEffect: boolean;
  selectedCategories: string[];
  selectedDeviceSeries: string[];
  selectedIosVersion?: string;
  launchYear?: string;
  category?: string;
  subCategory?: string;
  series?: string;
  sameAsCategory?: boolean;
}

const initialFormState: WallpaperForm = {
  imageUrl: '',
  wallpaperName: '',
  source: 'Official',
  exclusive: false,
  addAsBanner: false,
  depthEffect: false,
  selectedCategories: [],
  selectedDeviceSeries: [],
  category: '',
  subCategory: '',
  series: '',
  sameAsCategory: false
};

const appleDeviceYearMap: { [key: string]: number } = {
  "iPhone 16": 2024,
  "iPhone 15": 2023,
  "iPhone 14": 2022,
  "iPhone 13": 2021,
  "iPhone 12": 2020,
  "iPhone 11": 2019,
  "iPhone X": 2017,
  "iPhone 8": 2017,
  "iPhone 7": 2016,
  "iPad Pro": 2021,
  "iPad Air": 2022,
  "iPad Mini": 2021
};

const googleDeviceYearMap: { [key: string]: number } = {
  "Pixel 9": 2024,
  "Pixel 8": 2023,
  "Pixel 7": 2022,
  "Pixel 6": 2021,
  "Pixel 5": 2020,
  "Pixel 4": 2019,
  "Pixel 3": 2018,
  "Pixel 2": 2017,
  "Pixel": 2016
};

const AddWallpaperForm: React.FC = () => {
  const [wallpaperForms, setWallpaperForms] = useState<WallpaperForm[]>([
    { ...initialFormState }
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<{[key: string]: Device | null}>({});
  const [loading, setLoading] = useState(false);
  const [showBrandOptions, setShowBrandOptions] = useState<{[key: string]: boolean}>({});
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [useSharedCategories, setUseSharedCategories] = useState(false);
  const [wallpaperCount, setWallpaperCount] = useState<number>(3);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showProgressOverlay, setShowProgressOverlay] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);
  
  const getUrlWithL = (url: string): string => {
    const lastDotIndex = url.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return `${url.substring(0, lastDotIndex)}l${url.substring(lastDotIndex)}`;
    }
    return url;
  };
  
  const handleAddSameCategoryWallpaper = (count: number = 1) => {
    if (wallpaperForms.length === 0) return;
    
    const firstForm = wallpaperForms[0];
    const newForms = [];
    
    for (let i = 0; i < count; i++) {
      newForms.push({ 
        ...initialFormState,
        wallpaperName: firstForm.wallpaperName,
        source: firstForm.source,
        exclusive: firstForm.exclusive,
        addAsBanner: firstForm.addAsBanner,
        depthEffect: firstForm.depthEffect,
        selectedCategories: [...firstForm.selectedCategories],
        selectedDeviceSeries: [...firstForm.selectedDeviceSeries],
        selectedIosVersion: firstForm.selectedIosVersion,
        launchYear: firstForm.launchYear,
        category: firstForm.category,
        subCategory: firstForm.subCategory,
        series: firstForm.series,
        sameAsCategory: true
      });
    }
    
    setWallpaperForms(prevForms => [...prevForms, ...newForms]);
  };
  
  const handleAddDifferentCategoryWallpaper = () => {
    setWallpaperForms(prevForms => [
      ...prevForms,
      { ...initialFormState, sameAsCategory: false }
    ]);
  };
  
  const handleRemoveWallpaperForm = (index: number) => {
    if (wallpaperForms.length === 1) return;
    
    setWallpaperForms(prevForms => 
      prevForms.filter((_, i) => i !== index)
    );
  };
  
  const handleChange = (index: number, field: keyof WallpaperForm, value: any) => {
    setWallpaperForms(prevForms => {
      const updatedForms = [...prevForms];
      
      updatedForms[index] = {
        ...updatedForms[index],
        [field]: value
      };
      
      if (field === 'depthEffect' && value === true) {
        if (!updatedForms[index].selectedCategories.includes('Depth Effect')) {
          updatedForms[index].selectedCategories = [...updatedForms[index].selectedCategories, 'Depth Effect'];
        }
      } else if (field === 'depthEffect' && value === false) {
        updatedForms[index].selectedCategories = updatedForms[index].selectedCategories
          .filter(cat => cat !== 'Depth Effect');
      }
      
      if (index === 0) {
        if (field === 'selectedCategories' || field === 'source' || 
            field === 'exclusive' || field === 'addAsBanner' || 
            field === 'selectedDeviceSeries' || field === 'selectedIosVersion' ||
            field === 'category' || field === 'series' || field === 'depthEffect' ||
            field === 'launchYear' || field === 'subCategory' || field === 'wallpaperName') {
          updatedForms.forEach((form, i) => {
            if (i !== 0 && form.sameAsCategory) {
              updatedForms[i] = {
                ...updatedForms[i],
                [field]: Array.isArray(value) ? [...value] : value
              };
            }
          });
        }
      }
      
      return updatedForms;
    });
  };
  
  const handleCategoryChange = (index: number, categoryType: 'main' | 'brand', categoryName: string) => {
    setWallpaperForms(prevForms => {
      const updatedForms = [...prevForms];
      const form = { ...updatedForms[index] };
      
      const otherTypeCategories = form.selectedCategories.filter(cat => {
        const catObj = categories.find(c => c.categoryName === cat);
        return catObj && catObj.categoryType !== categoryType;
      });
      
      form.selectedCategories = [...otherTypeCategories, categoryName];
      
      if (categoryName === 'Depth Effect') {
        form.depthEffect = true;
      }
      
      if (categoryType === 'main') {
        form.category = categoryName;
      }
      
      if (categoryType === 'brand') {
        setShowBrandOptions(prev => ({...prev, [categoryName]: true}));
        fetchDevices(categoryName);
      }
      
      updatedForms[index] = form;
      
      if (index === 0) {
        updatedForms.forEach((form, i) => {
          if (i !== 0 && form.sameAsCategory) {
            updatedForms[i] = {
              ...updatedForms[i],
              selectedCategories: [...updatedForms[0].selectedCategories],
              category: updatedForms[0].category,
              depthEffect: updatedForms[0].depthEffect
            };
          }
        });
      }
      
      return updatedForms;
    });
  };
  
  const handleDeviceSeriesChange = (index: number, brand: string, deviceSeries: string, checked: boolean) => {
    setWallpaperForms(prevForms => {
      const updatedForms = [...prevForms];
      const form = { ...updatedForms[index] };
      
      if (checked) {
        form.selectedDeviceSeries = [deviceSeries];
        form.series = deviceSeries;
        
        const year = fetchLaunchYear(brand, deviceSeries);
        if (year) {
          form.launchYear = year;
        }
      } else {
        form.selectedDeviceSeries = [];
        form.series = '';
        form.launchYear = '';
      }
      
      updatedForms[index] = form;
      
      if (index === 0) {
        updatedForms.forEach((form, i) => {
          if (i !== 0 && form.sameAsCategory) {
            updatedForms[i] = {
              ...updatedForms[i],
              selectedDeviceSeries: [...updatedForms[0].selectedDeviceSeries],
              series: updatedForms[0].series,
              launchYear: updatedForms[0].launchYear
            };
          }
        });
      }
      
      return updatedForms;
    });
  };
  
  const fetchLaunchYear = (brand: string, deviceSeries: string): string | null => {
    try {
      const currentYear = new Date().getFullYear();
      
      let year = null;
      if (brand === 'Samsung') {
        year = samsungDeviceYearMap[deviceSeries] || currentYear;
      } else if (brand === 'Apple') {
        year = appleDeviceYearMap[deviceSeries] || currentYear;
      } else if (brand === 'Google') {
        year = googleDeviceYearMap[deviceSeries] || currentYear;
      } else {
        year = currentYear;
      }
      
      return year?.toString() || null;
    } catch (error) {
      console.error('Error getting launch year:', error);
      return null;
    }
  };
  
  const handleIosVersionChange = (index: number, iosVersion: string) => {
    setWallpaperForms(prevForms => {
      const updatedForms = [...prevForms];
      updatedForms[index] = {
        ...updatedForms[index],
        selectedIosVersion: iosVersion
      };
      
      if (index === 0) {
        updatedForms.forEach((form, i) => {
          if (i !== 0 && form.sameAsCategory) {
            updatedForms[i] = {
              ...updatedForms[i],
              selectedIosVersion: iosVersion
            };
          }
        });
      }
      
      return updatedForms;
    });
  };
  
  const handleRemoveCategory = (index: number, category: string) => {
    setWallpaperForms(prevForms => {
      const updatedForms = [...prevForms];
      const form = { ...updatedForms[index] };
      
      form.selectedCategories = form.selectedCategories.filter(c => c !== category);
      
      if (category === 'Depth Effect') {
        form.depthEffect = false;
      }
      
      const categoryObj = categories.find(c => c.categoryName === category);
      
      if (categoryObj?.categoryType === 'main') {
        form.category = '';
      } else if (categoryObj?.categoryType === 'brand') {
        setShowBrandOptions(prev => ({...prev, [category]: false}));
        form.selectedDeviceSeries = [];
        form.series = '';
        form.launchYear = '';
        if (category === 'Apple') {
          form.selectedIosVersion = undefined;
        }
      }
      
      updatedForms[index] = form;
      
      if (index === 0) {
        updatedForms.forEach((form, i) => {
          if (i !== 0 && form.sameAsCategory) {
            updatedForms[i] = {
              ...updatedForms[i],
              selectedCategories: [...updatedForms[0].selectedCategories],
              category: updatedForms[0].category,
              selectedDeviceSeries: [...updatedForms[0].selectedDeviceSeries], 
              series: updatedForms[0].series,
              selectedIosVersion: updatedForms[0].selectedIosVersion,
              depthEffect: updatedForms[0].depthEffect,
              launchYear: updatedForms[0].launchYear
            };
          }
        });
      }
      
      return updatedForms;
    });
  };
  
  const fetchDevices = async (brand: string) => {
    try {
      const devicesData = await getDevices(brand);
      
      if (devicesData) {
        if ('devices' in devicesData) {
          setDevices(prev => ({...prev, [brand]: devicesData as Device}));
        } else {
          const formattedDeviceData: Device = {
            devices: Array.isArray(devicesData.devices) ? devicesData.devices : [],
            iosVersions: Array.isArray(devicesData.iosVersions) ? devicesData.iosVersions : []
          };
          setDevices(prev => ({...prev, [brand]: formattedDeviceData}));
        }
      }
    } catch (error) {
      console.error(`Error fetching devices for ${brand}:`, error);
      toast.error(`Failed to load devices for ${brand}`);
    }
  };
  
  const validateForm = (form: WallpaperForm): boolean => {
    if (!form.imageUrl.trim()) {
      toast.error('Image URL is required');
      return false;
    }
    
    if (!form.wallpaperName.trim()) {
      toast.error('Wallpaper name is required');
      return false;
    }
    
    if (form.selectedCategories.length === 0) {
      toast.error('At least one category must be selected');
      return false;
    }
    
    const brandCategories = form.selectedCategories.filter(cat => 
      categories.find(c => c.categoryName === cat && c.categoryType === 'brand')
    );
    
    for (const brand of brandCategories) {
      if (devices[brand] && form.selectedDeviceSeries.length === 0) {
        toast.error(`At least one device series must be selected for ${brand} wallpapers`);
        return false;
      }
      
      if (brand === 'Apple' && !form.selectedIosVersion && devices[brand]?.iosVersions?.length > 0) {
        toast.error('Please select an iOS version for Apple wallpapers');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowProgressOverlay(true);
    setUploadProgress(0);
    
    try {
      for (const form of wallpaperForms) {
        if (!validateForm(form)) {
          setLoading(false);
          setShowProgressOverlay(false);
          return;
        }
      }
      
      for (const form of wallpaperForms) {
        const isDuplicate = await checkDuplicateWallpaper(form.imageUrl);
        if (isDuplicate) {
          toast.error(`Wallpaper with URL "${form.imageUrl}" already exists`);
          setLoading(false);
          setShowProgressOverlay(false);
          return;
        }
      }
      
      const totalOperations = wallpaperForms.length;
      let completedOperations = 0;
      
      for (const form of wallpaperForms) {
        const uniqueId = crypto.randomUUID();
        
        const mainCategory = form.selectedCategories.find(cat => 
          categories.find(c => c.categoryName === cat && c.categoryType === 'main')
        );
        
        if (mainCategory || form.category) {
          const trendingWallpaperData = {
            wallpaperName: form.wallpaperName,
            imageUrl: form.imageUrl,
            thumbnail: getUrlWithL(form.imageUrl),
            source: form.source,
            exclusive: form.exclusive,
            depthEffect: form.depthEffect,
            category: form.category || mainCategory || '',
            subCategory: form.subCategory || 'None',
            views: 0,
            downloads: 0
          };
          
          await addTrendingWallpaperWithId(uniqueId, trendingWallpaperData);
        }
        
        const brandCategories = form.selectedCategories.filter(cat => 
          categories.find(c => c.categoryName === cat && c.categoryType === 'brand')
        );
        
        for (const brand of brandCategories) {
          if (devices[brand] && form.selectedDeviceSeries.length > 0) {
            for (const deviceSeries of form.selectedDeviceSeries) {
              const launchYearValue = brand === 'Samsung' && form.launchYear
                ? parseInt(form.launchYear, 10)
                : form.launchYear || '';
              
              const brandWallpaperData: any = {
                wallpaperName: form.wallpaperName,
                imageUrl: form.imageUrl,
                thumbnail: getUrlWithL(form.imageUrl),
                series: deviceSeries,
                launchYear: launchYearValue,
                views: 0,
                downloads: 0
              };
              
              if (brand === 'Apple' && form.selectedIosVersion) {
                brandWallpaperData.iosVersion = form.selectedIosVersion;
              }
              
              const deviceUniqueId = `${uniqueId}-${deviceSeries}`;
              await addBrandWallpaperWithId(brand, deviceUniqueId, brandWallpaperData);
            }
          } else {
            const launchYearValue = brand === 'Samsung' && form.launchYear
              ? parseInt(form.launchYear, 10)
              : form.launchYear || '';
              
            const brandWallpaperData = {
              wallpaperName: form.wallpaperName,
              imageUrl: form.imageUrl,
              thumbnail: getUrlWithL(form.imageUrl),
              series: form.series || 'Default Series',
              launchYear: launchYearValue,
              views: 0,
              downloads: 0
            };
            
            const brandUniqueId = `${uniqueId}-${brand}`;
            await addBrandWallpaperWithId(brand, brandUniqueId, brandWallpaperData);
          }
        }
        
        if (form.addAsBanner) {
          const getUrlWithH = (url: string): string => {
            const lastDotIndex = url.lastIndexOf('.');
            if (lastDotIndex !== -1) {
              return `${url.substring(0, lastDotIndex)}h${url.substring(lastDotIndex)}`;
            }
            return url;
          };
          
          await addBannerWithId(uniqueId, {
            bannerName: form.wallpaperName,
            bannerUrl: getUrlWithH(form.imageUrl)
          });
        }
        
        completedOperations++;
        setUploadProgress(Math.round((completedOperations / totalOperations) * 100));
      }
      
      toast.success('Wallpaper(s) added successfully');
      
      setWallpaperForms([{ ...initialFormState }]);
      setUseSharedCategories(false);
      setShowBrandOptions({});
    } catch (error) {
      console.error('Error adding wallpaper:', error);
      toast.error('Failed to add wallpaper');
    } finally {
      setLoading(false);
      setShowProgressOverlay(false);
      setUploadProgress(0);
    }
  };
  
  const getSelectedMainCategory = (form: WallpaperForm) => {
    return form.selectedCategories.find(cat => 
      categories.find(c => c.categoryName === cat && c.categoryType === 'main')
    ) || '';
  };
  
  const getSelectedBrandCategory = (form: WallpaperForm) => {
    return form.selectedCategories.find(cat => 
      categories.find(c => c.categoryName === cat && c.categoryType === 'brand')
    ) || '';
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-10 relative">
      <WallpaperFormHeader 
        onAddSameCategory={handleAddSameCategoryWallpaper}
        onAddDifferentCategory={handleAddDifferentCategoryWallpaper}
        wallpaperCount={wallpaperCount}
        setWallpaperCount={setWallpaperCount}
      />
      
      {wallpaperForms.map((form, index) => (
        <WallpaperFormItem
          key={index}
          form={form}
          index={index}
          categories={categories}
          devices={devices}
          showRemoveButton={wallpaperForms.length > 1}
          onRemove={() => handleRemoveWallpaperForm(index)}
          onFieldChange={(field, value) => handleChange(index, field, value)}
          onCategoryChange={(categoryType, categoryName) => handleCategoryChange(index, categoryType, categoryName)}
          onRemoveCategory={(category) => handleRemoveCategory(index, category)}
          onAddCategoryClick={() => setCategoryDialogOpen(true)}
          onDeviceSeriesChange={(brand, deviceSeries, checked) => 
            handleDeviceSeriesChange(index, brand, deviceSeries, checked)
          }
          onIosVersionChange={(version) => handleIosVersionChange(index, version)}
          getSelectedMainCategory={() => getSelectedMainCategory(form)}
          getSelectedBrandCategory={() => getSelectedBrandCategory(form)}
          showCategories={true}
        />
      ))}
      
      <SubmitButton loading={loading} />
      
      <CategoryDialog 
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCategoriesUpdated={() => {
          getCategories().then(categoriesData => {
            setCategories(categoriesData);
          });
        }}
      />
      
      {showProgressOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center space-y-4">
              <Loader className="h-10 w-10 text-primary animate-spin mx-auto" />
              <h3 className="text-xl font-medium">Uploading Wallpapers</h3>
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p className="text-muted-foreground">{uploadProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default AddWallpaperForm;
