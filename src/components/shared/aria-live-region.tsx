"use client";

import * as React from "react";

/**
 * A shared component to announce dynamic state changes to screen readers.
 * Usage: Place this component high up in the component tree and update its children or message prop.
 */
export function AriaLiveRegion({
  message,
  politeness = "polite",
}: {
  message: string;
  politeness?: "polite" | "assertive";
}) {
  // Screen readers will announce changes to the text content automatically


  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      role={politeness === "assertive" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
