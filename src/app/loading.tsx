import * as React from "react";

export default function Loading() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--color-brand-blue)]" />
      <p className="text-xs font-medium text-slate-500 animate-pulse">
        Loading LexiGuide AI...
      </p>
    </div>
  );
}
