import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Chargement des données...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-6 ${
        fullHeight ? 'min-h-[50vh]' : 'py-12'
      }`}
    >
      <div
        className={`${sizeClasses[size]} border-rose-600 border-t-transparent rounded-full animate-spin`}
      ></div>
      {message && <p className="text-xs text-slate-500 font-medium">{message}</p>}
    </div>
  );
};
