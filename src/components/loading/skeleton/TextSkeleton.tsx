"use client";

import { cn } from "@/utils/cn";
import { Skeleton, type SkeletonProps } from "./Skeleton";

type UnitType = "%" | "px" | "rem" | "vw";
type LineSize = "full" | `${number}${UnitType}`;

type TextSkeletonProps = SkeletonProps & {
  lines?: LineSize[];
};

export function TextSkeleton({
  className,
  lines = ["full"],
  ...props
}: TextSkeletonProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {lines.map((line) => {
        const width = line === "full" ? "100%" : line;

        return (
          <Skeleton
            className={cn("h-3 rounded-full", className)}
            key={line}
            style={{ width }}
            {...props}
          />
        );
      })}
    </div>
  );
}
