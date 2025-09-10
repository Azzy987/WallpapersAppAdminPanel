
import React from 'react';
import { cn } from '@/lib/utils';

interface AnalyticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  animationDelay?: number;
}

const AnalyticCard: React.FC<AnalyticCardProps> = ({ 
  title, 
  value, 
  icon, 
  className,
  animationDelay = 0 
}) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="text-primary/30">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticCard;
