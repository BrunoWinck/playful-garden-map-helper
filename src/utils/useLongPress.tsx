
import { useCallback, useRef } from "react";

interface LongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // time in milliseconds
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: LongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef<boolean>(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    start();
  }, [start]);

  const handleMouseUp = useCallback(() => {
    clear();
  }, [clear]);

  const handleMouseLeave = useCallback(() => {
    clear();
  }, [clear]);

  const handleClick = useCallback(() => {
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  const handleTouchStart = useCallback(() => {
    start();
  }, [start]);

  const handleTouchEnd = useCallback(() => {
    clear();
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [clear, onClick]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
