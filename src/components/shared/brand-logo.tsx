import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  variant?: "auto" | "light" | "dark" | "icon" | "full";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  withLink?: boolean;
}

export function BrandLogo({
  variant = "auto",
  className,
  width,
  height,
  priority = false,
  withLink = true,
}: BrandLogoProps) {
  // If variant is 'auto', render dual images switched via CSS dark: class to prevent hydration mismatch
  if (variant === "auto") {
    const finalWidth = width || 200;
    const finalHeight = height || 55;

    const dualImageElement = (
      <span className="relative inline-flex items-center">
        <Image
          src={BRAND.assets.logoLight}
          alt="LexiGuide AI — Understand. Compare. Act with confidence."
          width={finalWidth}
          height={finalHeight}
          priority={priority}
          className={cn("dark:hidden object-contain transition-opacity", className)}
        />
        <Image
          src={BRAND.assets.logoDark}
          alt="LexiGuide AI — Understand. Compare. Act with confidence."
          width={finalWidth}
          height={finalHeight}
          priority={priority}
          className={cn("hidden dark:inline-block object-contain transition-opacity", className)}
        />
      </span>
    );

    if (withLink) {
      return (
        <Link
          href="/"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-md)]"
          aria-label="LexiGuide AI Home"
        >
          {dualImageElement}
        </Link>
      );
    }

    return dualImageElement;
  }

  const assetMap = {
    light: {
      src: BRAND.assets.logoLight,
      defaultWidth: 200,
      defaultHeight: 55,
      alt: "LexiGuide AI — Understand. Compare. Act with confidence.",
    },
    dark: {
      src: BRAND.assets.logoDark,
      defaultWidth: 220,
      defaultHeight: 78,
      alt: "LexiGuide AI — Understand. Compare. Act with confidence.",
    },
    icon: {
      src: BRAND.assets.icon,
      defaultWidth: 48,
      defaultHeight: 52,
      alt: "LexiGuide AI Mark",
    },
    full: {
      src: BRAND.assets.logoFull,
      defaultWidth: 280,
      defaultHeight: 72,
      alt: "LexiGuide AI — Understand. Compare. Act with confidence.",
    },
  };

  const selected = assetMap[variant];
  const finalWidth = width || selected.defaultWidth;
  const finalHeight = height || selected.defaultHeight;

  const imageElement = (
    <Image
      src={selected.src}
      alt={selected.alt}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      className={cn("object-contain transition-opacity", className)}
    />
  );

  if (withLink) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-md)]"
        aria-label="LexiGuide AI Home"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
