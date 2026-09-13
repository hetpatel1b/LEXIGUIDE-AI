import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  variant?: "light" | "dark" | "icon" | "full";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  withLink?: boolean;
}

export function BrandLogo({
  variant = "light",
  className,
  width,
  height,
  priority = false,
  withLink = true,
}: BrandLogoProps) {
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
        className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-blue)] rounded-md"
        aria-label="LexiGuide AI Home"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
