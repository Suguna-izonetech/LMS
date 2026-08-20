import React from 'react';
import { Card, CardContent } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  description?: string;
  icon?: React.ComponentType<any>;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  description,
  icon: Icon,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-5 flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-3.5 bg-slate-800 rounded-md w-1/2" />
            <div className="h-7 bg-slate-800 rounded-md w-3/4" />
            <div className="h-3 bg-slate-800 rounded-md w-2/3" />
          </div>
          <div className="h-10 w-10 bg-slate-800 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card hoverable className="card-hover-effect">
      <CardContent className="p-5 flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-100 font-display">
              {value}
            </span>
            {trend && (
              <span
                className={`
                  flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md
                  ${
                    trend.isPositive
                      ? 'text-emerald-400 bg-emerald-950/20'
                      : 'text-rose-450 bg-rose-950/20'
                  }
                `}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 shrink-0 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 shrink-0 mr-0.5" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-550 font-medium">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-950/40 border border-violet-500/20 text-violet-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
