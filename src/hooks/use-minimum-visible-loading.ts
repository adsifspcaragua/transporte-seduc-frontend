"use client";

import { useEffect, useRef, useState } from "react";

export const MINIMUM_LOADING_VISIBLE_MS = 1000;

export function useMinimumVisibleLoading(
  isLoading: boolean,
  minVisibleMs = MINIMUM_LOADING_VISIBLE_MS,
) {
  const [isVisible, setIsVisible] = useState(isLoading);
  const visibleStartedAtRef = useRef<number | null>(
    isLoading ? Date.now() : null,
  );

  useEffect(() => {
    if (isLoading) {
      visibleStartedAtRef.current = Date.now();
      setIsVisible(true);
      return;
    }

    const visibleStartedAt = visibleStartedAtRef.current;

    if (!visibleStartedAt) {
      setIsVisible(false);
      return;
    }

    const remainingMs = minVisibleMs - (Date.now() - visibleStartedAt);

    if (remainingMs <= 0) {
      visibleStartedAtRef.current = null;
      setIsVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      visibleStartedAtRef.current = null;
      setIsVisible(false);
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoading, minVisibleMs]);

  return isVisible;
}
