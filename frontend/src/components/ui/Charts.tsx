import React, { useState } from 'react';

// ==========================================
// 1. Line / Area Chart
// ==========================================
export interface LineChartData {
  label: string;
  value: number;
  value2?: number; // Optional secondary series
}

export interface LineChartProps {
  data: LineChartData[];
  height?: number;
  series1Label?: string;
  series2Label?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  series1Label = 'Series 1',
  series2Label = 'Series 2',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate scales
  const maxVal = Math.max(
    ...data.flatMap(d => [d.value, d.value2 ?? 0]),
    100 // baseline min
  );
  
  const getX = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
  const getY = (val: number) => padding + chartHeight - (val / maxVal) * chartHeight;

  // Build SVG Paths
  let path1 = '';
  let area1 = '';
  let path2 = '';
  let area2 = '';

  data.forEach((d, idx) => {
    const x = getX(idx);
    const y1 = getY(d.value);
    
    if (idx === 0) {
      path1 = `M ${x} ${y1}`;
      area1 = `M ${x} ${padding + chartHeight} L ${x} ${y1}`;
    } else {
      path1 += ` L ${x} ${y1}`;
      area1 += ` L ${x} ${y1}`;
    }

    if (idx === data.length - 1) {
      area1 += ` L ${x} ${padding + chartHeight} Z`;
    }

    if (d.value2 !== undefined) {
      const y2 = getY(d.value2);
      if (idx === 0) {
        path2 = `M ${x} ${y2}`;
        area2 = `M ${x} ${padding + chartHeight} L ${x} ${y2}`;
      } else {
        path2 += ` L ${x} ${y2}`;
        area2 += ` L ${x} ${y2}`;
      }
      if (idx === data.length - 1) {
        area2 += ` L ${x} ${padding + chartHeight} Z`;
      }
    }
  });

  return (
    <div className="relative w-full text-slate-400">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const yVal = padding + chartHeight * p;
          const labelVal = Math.round(maxVal * (1 - p));
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={yVal}
                x2={width - padding}
                y2={yVal}
                stroke="#1e293b"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <text x={padding - 10} y={yVal + 4} textAnchor="end" className="text-[10px] fill-slate-500 font-medium">
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, idx) => (
          <text
            key={idx}
            x={getX(idx)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-[10px] fill-slate-500 font-semibold"
          >
            {d.label}
          </text>
        ))}

        {/* Shaded Area 1 (Primary: Indigo) */}
        <path d={area1} fill="url(#grad1)" opacity="0.15" />
        
        {/* Line 1 */}
        <path d={path1} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" />

        {/* Shaded Area 2 (Secondary: Emerald) */}
        {path2 && <path d={area2} fill="url(#grad2)" opacity="0.1" />}
        {/* Line 2 */}
        {path2 && <path d={path2} fill="none" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1 1" />}

        {/* Nodes / Hover overlays */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const y1 = getY(d.value);
          const y2 = d.value2 !== undefined ? getY(d.value2) : null;
          const isHovered = hoverIndex === idx;

          return (
            <g key={idx} onMouseEnter={() => setHoverIndex(idx)} onMouseLeave={() => setHoverIndex(null)}>
              {/* Invisible touch target column */}
              <rect
                x={x - 15}
                y={padding}
                width={30}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
              />
              {/* Vertical line indicator on hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + chartHeight}
                  stroke="#475569"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                />
              )}
              {/* Points */}
              <circle
                cx={x}
                cy={y1}
                r={isHovered ? 5 : 3}
                fill="#6366f1"
                stroke="#0b0f19"
                strokeWidth={1.5}
                className="transition-all duration-100"
              />
              {y2 !== null && (
                <circle
                  cx={x}
                  cy={y2}
                  r={isHovered ? 5 : 3}
                  fill="#10b981"
                  stroke="#0b0f19"
                  strokeWidth={1.5}
                  className="transition-all duration-100"
                />
              )}
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* HTML Tooltip */}
      {hoverIndex !== null && (
        <div
          className="absolute z-20 bg-slate-900 border border-slate-800 rounded-lg p-2.5 shadow-md text-xs pointer-events-none"
          style={{
            left: `${(getX(hoverIndex) / width) * 100}%`,
            top: `${(getY(data[hoverIndex].value) / height) * 100 - 35}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">{data[hoverIndex].label}</div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            <span>{series1Label}: <strong className="text-slate-100">{data[hoverIndex].value}</strong></span>
          </div>
          {data[hoverIndex].value2 !== undefined && (
            <div className="flex items-center gap-1.5 text-slate-300 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{series2Label}: <strong className="text-slate-100">{data[hoverIndex].value2}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. Bar Chart
// ==========================================
export interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: 'indigo' | 'emerald';
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 180,
  color = 'indigo',
}) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const colorClass = color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600';
  const hoverClass = color === 'indigo' ? 'hover:bg-indigo-500' : 'hover:bg-emerald-500';

  return (
    <div className="flex items-end justify-between w-full pt-4 px-2" style={{ height: `${height}px` }}>
      {data.map((d, idx) => {
        const heightPct = (d.value / maxVal) * 80; // Cap at 80% to leave room for value overlay
        return (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            {/* Value Label */}
            <span className="text-[10px] font-bold text-slate-200 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {d.value}
            </span>
            {/* Bar */}
            <div
              style={{ height: `${Math.max(heightPct, 4)}%` }}
              className={`w-8 rounded-t-sm ${colorClass} ${hoverClass} transition-all duration-200 cursor-pointer shadow-sm`}
            />
            {/* Label */}
            <span className="text-[10px] text-slate-500 font-semibold mt-2.5 text-center truncate max-w-[60px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 3. Doughnut Chart
// ==========================================
export interface DoughnutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DoughnutChartProps {
  data: DoughnutSegment[];
  size?: number;
  thickness?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  size = 140,
  thickness = 16,
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const center = size / 2;
  const radius = center - thickness;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex items-center gap-6">
      {/* Circle rendering */}
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base gray trail */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={thickness}
          />
          {data.map((segment, idx) => {
            const pct = segment.value / total;
            const strokeDashoffset = circumference - pct * circumference;
            const strokeDasharray = `${circumference} ${circumference}`;
            const rotation = accumulatedPercent * 360;
            accumulatedPercent += pct;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transformOrigin: 'center',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-100">{total}</span>
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Active</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-2">
        {data.map((d, idx) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: d.color }} />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-semibold text-slate-300">{d.label}</span>
                <span className="text-[10px] text-slate-500 font-bold">{d.value} ({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
