import React from 'react';
import {
  Zap,
  Flame,
  Fuel,
  Truck,
  Plane,
  Factory,
  Droplets,
  Recycle,
} from 'lucide-react';
import { ActivityStreamKey, STREAM_METADATA } from '../../utils/calculations';

interface CategoryBadgeProps {
  streamKey: ActivityStreamKey;
  showUnit?: boolean;
  sharePercent?: number;
  size?: 'sm' | 'md';
}

export const STREAM_ICON_MAP: Record<ActivityStreamKey, React.FC<{ className?: string }>> = {
  electricity: Zap,
  cookingGas: Flame,
  petrol: Fuel,
  diesel: Truck,
  airTravel: Plane,
  naturalGas: Factory,
  water: Droplets,
  waste: Recycle,
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  streamKey,
  showUnit = false,
  sharePercent,
  size = 'sm',
}) => {
  const meta = STREAM_METADATA[streamKey] || STREAM_METADATA.electricity;
  const Icon = STREAM_ICON_MAP[streamKey] || Zap;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
      style={{
        backgroundColor: `${meta.color}18`,
        borderColor: `${meta.color}45`,
        color: meta.color,
      }}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{meta.label}</span>
      {typeof sharePercent === 'number' && (
        <span className="opacity-80 font-mono">({sharePercent}%)</span>
      )}
      {showUnit && <span className="opacity-75 font-mono">({meta.unitMetric})</span>}
    </span>
  );
};
