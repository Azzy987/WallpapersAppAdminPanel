
import React from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';

interface SubmitButtonProps {
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading }) => {
  return (
    <div className="mt-8 flex justify-end">
      <Button type="submit" className="w-full md:w-auto" disabled={loading}>
        {loading ? (
          <>
            <span className="mr-2">Adding Wallpaper...</span>
            <ImageIcon className="h-4 w-4 animate-pulse" />
          </>
        ) : (
          <>
            <span>Add Wallpaper</span>
            <ImageIcon className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default SubmitButton;
