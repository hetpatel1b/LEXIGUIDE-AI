import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants/brand";

export interface BrandLogoProps {
  variant?: "logo" | "app-icon" | "icon" | "light" | "auto" | "full" | "dark";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  withLink?: boolean;
  style?: React.CSSProperties;
}

export function BrandLogo({
  variant = "logo",
  className,
  width,
  height,
  priority = false,
  withLink = true,
  style,
}: BrandLogoProps) {
  // Mapping variants to dedicated official brand assets:
  // - Topbar / header: lexiguide-logo-light.png (3:1 natural aspect ratio: 2172x724)
  // - Landing footer: lexiguide-icon.png (1:1 natural aspect ratio: 1254x1254, standalone icon without wordmark)
  // - Browser / favicon / site icon: lexiguide-app-icon.png (1:1 natural aspect ratio: 1254x1254, square app icon)
  let src: string;
  let defaultWidth: number;
  let defaultHeight: number;
  let alt: string;

  if (variant === "icon") {
    src = BRAND.assets.icon;
    defaultWidth = 40;
    defaultHeight = 40;
    alt = "LexiGuide AI Icon";
  } else if (variant === "app-icon") {
    src = BRAND.assets.appIcon;
    defaultWidth = 40;
    defaultHeight = 40;
    alt = "LexiGuide AI App Icon";
  } else {
    // "logo", "light", "auto", "full", "dark" -> light horizontal logo is the topbar brand asset
    src = BRAND.assets.logoLight;
    defaultWidth = 144;
    defaultHeight = 48;
    alt = "LexiGuide AI — Understand. Compare. Act with confidence.";
  }

  const finalWidth = width || defaultWidth;
  const finalHeight = height || defaultHeight;

  const imageElement = (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      style={{
        width: "auto",
        height: `${finalHeight}px`,
        maxWidth: "100%",
        ...style,
      }}
      className={cn("object-contain", className)}
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
