import React from "react";

export default function EmptyStatePage({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center h-full text-zinc-500 font-['Geist',sans-serif]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
          <span className="text-zinc-600 text-2xl font-semibold">{title.charAt(0)}</span>
        </div>
        <h2 className="text-lg font-medium text-zinc-300">{title}</h2>
        <p className="text-sm text-zinc-500 max-w-[280px] text-center">
          This feature is currently in development. Check back soon.
        </p>
      </div>
    </div>
  );
}