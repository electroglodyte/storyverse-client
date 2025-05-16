import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { DailyProgress } from '../../supabase-tables';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface DailyProgressChartProps {
  data: DailyProgress[];
}

export default function DailyProgressChart({ data }: DailyProgressChartProps) {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Format date for display and add calculated fields
    return sortedData.map(day => {
      const date = new Date(day.date);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      return {
        ...day,
        formattedDate,
        date: day.date,
        words: day.total_word_count || 0,
        minutes: day.total_time_minutes || 0,
        wpm: day.total_time_minutes ? Math.round(day.total_word_count / day.total_time_minutes) : 0
      };
    });
  }, [data]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      
      return (
        <div className="bg-background border rounded shadow-md p-3">
          <p className="font-bold">{new Date(dayData.date).toLocaleDateString()}</p>
          <p>Words: {dayData.words.toLocaleString()}</p>
          <p>Time: {dayData.minutes} mins</p>
          <p>WPM: {dayData.wpm}</p>
          {dayData.scenes_worked > 0 && <p>Scenes: {dayData.scenes_worked}</p>}
          {dayData.goals_completed > 0 && <p>Goals Completed: {dayData.goals_completed}</p>}
        </div>
      );
    }
  
    return null;
  };
  
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground text-center">
          No writing data available yet. Start recording your sessions to see progress.
        </p>
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="words" className="h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="words">Word Count</TabsTrigger>
        <TabsTrigger value="time">Time Spent</TabsTrigger>
        <TabsTrigger value="wpm">Words per Minute</TabsTrigger>
      </TabsList>
      
      <TabsContent value="words" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="words" name="Words" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="time" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="minutes" name="Minutes" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="wpm" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="wpm" 
              name="Words per Minute" 
              stroke="#ff7300" 
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}
