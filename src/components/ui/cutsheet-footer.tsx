import { Link } from "react-router-dom";

export default function CutsheetFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-zinc-950 pb-8 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/cutsheet-logo.png" alt="Cutsheet" className="h-[23px] w-[23px]" />
            <span
              className="text-white"
              style={{ fontFamily: "'TBJ Interval', monospace", fontSize: "20px" }}
            >
              cutsheet
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Terms
            </Link>
            <Link
              to="/changelog"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Changelog
            </Link>
            <a
              href="mailto:hello@cutsheet.ai"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              hello@cutsheet.ai
            </a>
          </div>

          {/* Social + copyright */}
          <div className="flex items-center gap-5">
            <a
              href="https://x.com/getcutsheet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 transition-colors hover:text-zinc-300"
              aria-label="Follow on X"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/getcutsheet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 transition-colors hover:text-zinc-300"
              aria-label="Follow on Instagram"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <span className="text-xs text-zinc-600">
              &copy; 2026 Cutsheet
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
