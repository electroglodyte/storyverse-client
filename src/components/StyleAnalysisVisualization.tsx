import React from 'react';
import { StyleMetric } from '@/types/style';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface StyleAnalysisVisualizationProps {
  metrics: StyleMetric[];
  showTooltips?: boolean;
  height?: number;
}

export const StyleAnalysisVisualization: React.FC<StyleAnalysisVisualizationProps> = ({
  metrics,
  showTooltips = true,
  height = 400,
}) => {
  // Transform metrics for radar chart
  const chartData = metrics.map(metric => ({
    subject: metric.name,
    value: metric.value,
    confidence: metric.confidence,
    fullMark: 10,
  }));

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 10]} />
          <Radar
            name="Style Profile"
            dataKey="value"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          {showTooltips && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 shadow rounded border">
                      <p className="font-semibold">{data.subject}</p>
                      <p>Value: {data.value.toFixed(2)}</p>
                      <p>Confidence: {(data.confidence * 100).toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};