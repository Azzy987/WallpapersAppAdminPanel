
import React from 'react';
import Layout from '@/components/Layout';
import AddWallpaperForm from '@/components/wallpaper/AddWallpaperForm';
import { ImagePlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const AddWallpaper = () => {
  const isMobile = useIsMobile();
  
  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold flex items-center gap-2 animate-fade-in`}>
          <ImagePlus className="h-8 w-8 text-primary" />
          Add Wallpaper
        </h1>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          Upload new wallpapers to your collection
        </p>
      </div>
      <AddWallpaperForm />
    </Layout>
  );
};

export default AddWallpaper;
