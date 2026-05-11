import { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 72; // px to pull before triggering refresh

/**
 * PullToRefresh — wraps a scrollable container and triggers onRefresh when pulled down.
 * Only active on touch devices.
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPulling(true);
      // Dampen: first 72px full, then logarithmic
      const damped = delta < THRESHOLD ? delta : THRESHOLD + Math.log(delta - THRESHOLD + 1) * 10;
      setPullY(Math.min(damped, THRESHOLD + 30));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPulling(false);
        setPullY(0);
        startY.current = null;
      }
    } else {
      setPulling(false);
      setPullY(0);
      startY.current = null;
    }
  }, [pullY, refreshing, onRefresh]);

  const indicatorOpacity = Math.min(pullY / THRESHOLD, 1);
  const indicatorRotation = (pullY / THRESHOLD) * 180;

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto overscroll-none ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pulling && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullY, opacity: indicatorOpacity }}
        >
          <div
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
            style={{ transform: `rotate(${indicatorRotation}deg)` }}
          >
            {refreshing
              ? <Loader2 size={16} className="text-primary animate-spin" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(142,60%,28%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            }
          </div>
        </div>
      )}
      {children}
    </div>
  );
}