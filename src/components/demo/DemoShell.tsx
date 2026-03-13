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
      style={{ background: "transparent" }}
    >
      <div className="relative w-full h-full">{children}</div>
    </div>
  );
}
