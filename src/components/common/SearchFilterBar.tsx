import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  categories?: { id: string; name: string }[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  statuses?: { value: string; label: string }[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  children?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search,
  onSearchChange,
  placeholder = 'Rechercher...',
  categories,
  selectedCategory,
  onCategoryChange,
  statuses,
  selectedStatus,
  onStatusChange,
  children,
}) => {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white transition-all"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {categories && onCategoryChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory || 'ALL'}
              onChange={e => onCategoryChange(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {statuses && onStatusChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <select
              value={selectedStatus || 'ALL'}
              onChange={e => onStatusChange(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
