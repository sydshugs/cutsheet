// src/pages/SafeZoneDemo.tsx — dev preview for SafeZonePreview component

import { SafeZonePreview } from "../components/SafeZonePreview";

// A vibrant 9:16 placeholder image from picsum
const DEMO_IMAGE = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=1200&fit=crop";

export default function SafeZoneDemo() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 gap-6">
      <div className="text-center mb-2">
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Safe Zone Preview</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform-aware danger zone overlay for ad creatives</p>
      </div>
      <SafeZonePreview
        imageUrl={DEMO_IMAGE}
        platform="tiktok"
        mode="paid"
      />
    </div>
  );
}
