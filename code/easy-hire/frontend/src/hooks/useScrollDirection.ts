import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | 'top';

const SCROLL_UP_TOLERANCE = 5;
const SCROLL_DOWN_TOLERANCE = 0;

/**
 * Tracks scroll direction relative to a threshold.
 * Returns 'top' when at the very top of the page (scrollY <= pinStart).
 */
export function useScrollDirection(pinStart = 0): {
  direction: ScrollDirection;
  scrolled: boolean;
} {
  const [direction, setDirection] = useState<ScrollDirection>('top');
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= pinStart) {
        setDirection('top');
        setScrolled(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      setScrolled(true);

      if (currentScrollY < lastScrollY.current - SCROLL_UP_TOLERANCE) {
        setDirection('up');
      } else if (currentScrollY > lastScrollY.current + SCROLL_DOWN_TOLERANCE) {
        setDirection('down');
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pinStart]);

  return { direction, scrolled };
}
