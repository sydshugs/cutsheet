interface DemoShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dark theme wrapper matching the real app's background + ambient glow.
 * Used by all demo sequences for consistent appearance.
 */
export function DemoShell({ children, className = "" }: DemoShellProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: "var(--bg, #08080F)" }}
    >
      {/* Ambient glow — matches App.tsx */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />

      <div className="relative w-full h-full">{children}</div>
    </div>
  );
}
