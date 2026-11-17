import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 1,
  durationMs = 420,
  prefix = '',
  suffix = '',
  locale = 'en-US',
  className = '',
}) => {
  const [displayVal, setDisplayVal] = useState<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    const startVal = prevRef.current;
    const endVal = value;
    if (Math.abs(endVal - startVal) < 0.001) {
      setDisplayVal(endVal);
      return;
    }

    let rafId: number;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Out-cubic easing for slot-machine feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplayVal(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        prevRef.current = endVal;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayVal);

  return (
    <span className={`font-mono tabular-nums inline-block ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
