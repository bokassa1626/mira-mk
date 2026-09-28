import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionText,
  onAction,
  action,
}) => {
  const btnLabel = actionText || action?.label;
  const btnClick = onAction || action?.onClick;

  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
      {btnLabel && btnClick && (
        <button
          onClick={btnClick}
          className="inline-flex items-center px-3.5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
};
