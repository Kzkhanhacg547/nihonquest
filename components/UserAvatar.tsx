"use client";

import React, { useEffect, useState } from "react";

export function isImageAvatarUrl(src?: string | null): boolean {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/")
  );
}

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  fallbackText?: string;
  sizeClass?: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Unified Avatar component across Navbar, Dashboard, Leaderboard, Profile, and Settings.
 * Handles base64 data URLs, http(s) URLs, relative paths, bot emoji badges, empty strings,
 * and broken image load errors gracefully.
 */
export function UserAvatar({
  src,
  name,
  fallbackText,
  sizeClass = "h-10 w-10 text-sm",
  className = "",
  imgClassName = "",
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const trimmedSrc = typeof src === "string" ? src.trim() : "";
  const isImage = isImageAvatarUrl(trimmedSrc) && failedSrc !== trimmedSrc;

  // Short non-URL string (e.g. emoji badge for Rival Bots like "🦊")
  const isShortBadge = Boolean(trimmedSrc && !isImageAvatarUrl(trimmedSrc) && trimmedSrc.length <= 4);

  const initial = (
    fallbackText?.trim() ||
    name?.trim()?.[0] ||
    "N"
  ).toUpperCase();

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmedSrc}
        alt={name ? `Ảnh đại diện của ${name}` : "Ảnh đại diện"}
        onError={() => setFailedSrc(trimmedSrc)}
        className={`inline-block shrink-0 rounded-full object-cover ${sizeClass} ${imgClassName || className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      title={name ?? undefined}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-black text-white ${sizeClass} ${
        className || "bg-gradient-to-br from-slate-800 to-red-900 ring-2 ring-white dark:ring-sumi-800"
      }`}
    >
      {isShortBadge ? trimmedSrc : initial}
    </span>
  );
}

