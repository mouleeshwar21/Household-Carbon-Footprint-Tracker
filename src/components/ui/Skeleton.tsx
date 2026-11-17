import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-24 w-full' }) => {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-emerald-500/10 border border-white/15 ${className}`}
    />
  );
};
