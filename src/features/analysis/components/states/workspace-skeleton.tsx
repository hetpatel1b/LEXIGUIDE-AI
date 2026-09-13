"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function WorkspaceSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] p-6 space-y-6 max-w-5xl mx-auto w-full text-left">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} density="compact" className="p-3.5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-2.5 w-20" />
          </Card>
        ))}
      </div>

      {/* Executive Summary Skeleton */}
      <Card density="spacious" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </Card>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card density="spacious" className="p-6 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>

        <Card density="spacious" className="p-6 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      </div>
    </div>
  );
}
