export default function CutsheetFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/cutsheet-logo.png" alt="Cutsheet" className="h-[23px] w-[23px]" />
            <span
              className="text-white"
              style={{ fontFamily: "'TBJ Interval', monospace", fontSize: "20px" }}
            >
              cutsheet
            </span>
          </a>

          <p className="text-xs text-zinc-600">
            &copy; 2026 Cutsheet. All rights reserved.
          </p>

          <a
            href="mailto:hello@cutsheet.ai"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            hello@cutsheet.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
