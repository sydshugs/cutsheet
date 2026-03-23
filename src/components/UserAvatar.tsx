// src/components/UserAvatar.tsx — Reusable avatar with priority logic
// 1. Google OAuth avatar (user_metadata.avatar_url or picture)
// 2. Initials fallback (first letter of email/name, indigo bg)

import { useState } from "react";

const SIZES = {
  sm: { size: 24, fontSize: 10 },
  md: { size: 32, fontSize: 13 },
  lg: { size: 40, fontSize: 16 },
} as const;

export interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
}

export function UserAvatar({ size = "md", avatarUrl, name, email }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { size: px, fontSize } = SIZES[size];
  const initial = (name?.charAt(0) || email?.charAt(0) || "U").toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || email || "Avatar"}
        onError={() => setImgError(true)}
        style={{
          width: px, height: px, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: px, height: px, borderRadius: "50%",
      background: "#6366f1",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, fontWeight: 600, color: "white", flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

export function getAvatarUrl(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  if (!user?.user_metadata) return null;
  const meta = user.user_metadata;
  return (meta.avatar_url as string) || (meta.picture as string) || null;
}
