import React from 'react';
import { Story } from '@/types/database';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { timeAgo } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';

interface DailyProgressChartProps {
  story: Story;
}

interface ChartData {
  name: string;
  value: number;
}

export const DailyProgressChart: React.FC<DailyProgressChartProps> = ({ story }) => {
  const [data, setData] = React.useState<ChartData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: ChartData[] = [
          { name: 'Mon', value: 1000 },
          { name: 'Tue', value: 2000 },
          { name: 'Wed', value: 1500 },
          { name: 'Thu', value: 3000 },
          { name: 'Fri', value: 2500 }
        ];
        setData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [story.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full h-64">
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};
