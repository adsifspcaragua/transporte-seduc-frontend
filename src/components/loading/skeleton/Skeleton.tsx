"use client";

import type { ComponentProps, ReactNode } from "react";

import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { cn } from "@/utils/cn";

export type SkeletonProps = ComponentProps<"div"> & {
  children?: ReactNode;
  fallback?: ReactNode;
  loading?: boolean;
  minVisibleMs?: number;
};

export function Skeleton({
  className,
  children,
  fallback,
  loading = true,
  minVisibleMs,
  ...props
}: SkeletonProps) {
  const shouldShowLoading = useMinimumVisibleLoading(loading, minVisibleMs);

  if (!shouldShowLoading) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      {...props}
      className={cn(
        "animation-loading-skeleton relative h-20 w-20 cursor-progress overflow-hidden rounded-2xl bg-skeleton",
        className,
      )}
    />
  );
}
