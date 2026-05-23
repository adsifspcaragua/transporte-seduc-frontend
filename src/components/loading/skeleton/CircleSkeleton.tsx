"use client";

import { cn } from "@/utils/cn";
import { Skeleton, type SkeletonProps } from "./Skeleton";

export function CircleSkeleton({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("rounded-full", className)} {...props} />;
}
