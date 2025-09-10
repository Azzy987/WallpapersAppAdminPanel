import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface FloatingScrollButtonProps {
  showThreshold?: number;
  scrollDuration?: number;
}

const FloatingScrollButton: React.FC<FloatingScrollButtonProps> = ({
  showThreshold = 200,
  scrollDuration = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [documentHeight, setDocumentHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentDocumentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;

      setScrollPosition(currentScrollY);
      setDocumentHeight(currentDocumentHeight);
      setIsVisible(currentScrollY > showThreshold);
    };

    const handleResize = () => {
      setDocumentHeight(document.documentElement.scrollHeight);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial check
    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [showThreshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const isAtTop = scrollPosition < showThreshold;
  const isAtBottom = scrollPosition + window.innerHeight >= documentHeight - 100;

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {/* Scroll to Bottom Button */}
      {!isAtBottom && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-110"
          title="Scroll to Bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Scroll to Top Button */}
      {!isAtTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-110"
          title="Scroll to Top"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FloatingScrollButton;