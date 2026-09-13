"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { getSafeErrorMessage } from "@/lib/utils";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    // Log sanitized error metrics to monitoring service in production
    console.error("Operational application error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="space-y-4 max-w-md">
        <span className="inline-block text-3xl font-mono text-amber-600" aria-hidden="true">
          ⚠️
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-600">
          {getSafeErrorMessage(error, "An unexpected issue occurred while rendering this page.")}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Try Again
          </Button>
          <Button variant="outline" size="md" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
