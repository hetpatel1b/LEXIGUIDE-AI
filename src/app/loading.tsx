import * as React from "react";

export default function Loading() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--color-brand-blue)] dark:border-slate-800 dark:border-t-sky-400" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        Loading LexiGuide AI...
      </p>
    </div>
  );
}
