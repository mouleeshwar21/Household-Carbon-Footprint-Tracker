import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const startVal = previousRef.current;
    const endVal = Number.isFinite(value) ? value : 0;
    if (Math.abs(startVal - endVal) < 0.001) {
      setDisplayValue(endVal);
      return;
    }

    const duration = 520;
    let frameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(current);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        previousRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      previousRef.current = endVal;
    };
  }, [value]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
