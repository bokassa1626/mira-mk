import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  trend,
}) => {
  const variantStyles = {
    primary: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200/60',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-red-200/60',
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200/60',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    purple: {
      bg: 'bg-white',
      border: 'border-purple-200/60',
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
    },
    neutral: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
  };

  const current = variantStyles[variant];

  return (
    <div className={`p-5 rounded-xl border ${current.border} ${current.bg} shadow-xs transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${current.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
};
