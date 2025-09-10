
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Image, Smartphone, Edit, Sun, Moon, Menu, X, Upload as UploadIcon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const SidebarContent = () => (
    <div className="w-full flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">WallpapersApp Admin</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="mt-4 flex-1">
        <Link to="/" className={`sidebar-item ${isActive('/')}`}>
          <BarChart3 className="h-5 w-5" />
          <span>Analytics</span>
        </Link>
        
        <Link to="/add-wallpaper" className={`sidebar-item ${isActive('/add-wallpaper')}`}>
          <Image className="h-5 w-5" />
          <span>Add Wallpaper</span>
        </Link>
        
        <Link to="/edit-wallpaper" className={`sidebar-item ${isActive('/edit-wallpaper')}`}>
          <Edit className="h-5 w-5" />
          <span>Edit Wallpaper</span>
        </Link>
        
        <Link to="/upload-wallpaper" className={`sidebar-item ${isActive('/upload-wallpaper')}`}>
          <UploadIcon className="h-5 w-5" />
          <span>Upload to S3</span>
        </Link>
        
        <Link to="/add-devices" className={`sidebar-item ${isActive('/add-devices')}`}>
          <Smartphone className="h-5 w-5" />
          <span>Add Devices</span>
        </Link>
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="text-white/50 text-xs">
          <p>© 2023 WallpapersApp Admin</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 p-4 flex items-center bg-sidebar z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-none">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-white">WallpapersApp</h1>
        </div>
        <div className="h-16"></div> {/* Spacer to compensate for fixed header */}
      </>
    );
  }

  return (
    <div className="w-64 bg-sidebar flex-shrink-0 flex flex-col h-screen sticky top-0 left-0">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
