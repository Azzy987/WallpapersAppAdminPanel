
import React, { useEffect, useState } from 'react';
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

// Mock data for the downloads chart
const generateMockData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return Array(12).fill(0).map((_, i) => {
    const month = months[i];
    // Generate higher numbers for recent months
    const downloads = i <= currentMonth 
      ? Math.floor(Math.random() * 500) + 100 
      : 0;
    
    return {
      month,
      downloads
    };
  });
};

const DownloadChart: React.FC = () => {
  const [data, setData] = useState<{ month: string; downloads: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-80 flex items-center justify-center animate-pulse">
        <p className="text-gray-400">Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <h3 className="text-xl font-semibold mb-6">Downloads Over Time</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={40}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFF', 
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E5E7EB',
                padding: '0.5rem'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="downloads" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorDownloads)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DownloadChart;
