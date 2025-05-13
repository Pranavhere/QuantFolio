import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const MarketInsightsChart = ({ dailyData }) => {
  // dailyData: [{ date, advancing, declining }]
  const data = dailyData?.map(day => ({
    name: day.date,
    Advancing: day.advancing,
    Declining: day.declining,
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] bg-card rounded-lg p-4 border border-border shadow-lg" style={{background: 'var(--card)'}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="name" 
            stroke="var(--foreground)"
            tick={{ fill: 'var(--foreground)' }}
          />
          <YAxis 
            stroke="var(--foreground)"
            tick={{ fill: 'var(--foreground)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              color: 'var(--foreground)',
              paddingTop: '20px'
            }}
          />
          <Bar 
            dataKey="Advancing" 
            fill="#22c55e"
            barSize={18}
            radius={[6, 6, 0, 0]}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <Bar 
            dataKey="Declining" 
            fill="#ef4444"
            barSize={18}
            radius={[6, 6, 0, 0]}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketInsightsChart; 