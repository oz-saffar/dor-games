import { useEffect, useState } from 'react';

/**
 * Live viewport metrics for layouts that need more than "is it landscape".
 *
 * `isTablet` is the one that matters for the iPad: Dor's 11" iPad is ~1194×834
 * in landscape, where a layout tuned for a phone lying on its side (a 390px-tall
 * strip) leaves half the glass empty. The short edge is what separates them —
 * every iPhone is under 500pt short-side, every iPad over 700pt — so it stays
 * right whichever way the device is held.
 */
const read = () => {
  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
  const height = typeof window === 'undefined' ? 844 : window.innerHeight;
  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: Math.min(width, height) >= 700,
  };
};

export function useViewport() {
  const [viewport, setViewport] = useState(read);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewport(read()));
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return viewport;
}

/** Landscape on a big screen — the case the phone layouts were never sized for. */
export function useIsTabletLandscape() {
  const { isLandscape, isTablet } = useViewport();
  return isLandscape && isTablet;
}
