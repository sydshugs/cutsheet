// TopBar.tsx — top bar for the main content area

import { useEffect, useRef, useState } from "react";
import { Clock, Menu, Plus, RotateCcw, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarProps {
  onNewAnalysis: () => void;
  onHistoryOpen: () => void;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  userName?: string;
  userPlan?: string;
  hasResult?: boolean;
}

export function TopBar({
  onNewAnalysis,
  onHistoryOpen,
  onMobileMenuToggle,
  userName,
  userPlan,
  hasResult,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";
  const planLabel = userPlan === "pro" ? "Pro" : "Free";

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 gap-3 relative z-20">
      {/* Mobile hamburger — visible below lg only */}
      <button
        className="lg:hidden text-zinc-400 hover:text-zinc-200 p-1"
        onClick={onMobileMenuToggle}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search pill — UI stub only */}
      <div className="bg-white/5 rounded-full flex items-center gap-2 px-3 py-1.5">
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Search analyses..."
          className="text-sm text-zinc-400 bg-transparent outline-none placeholder-zinc-500 w-60"
        />
      </div>

      {/* History button */}
      <button
        className="text-zinc-500 hover:text-zinc-300 p-1.5 transition-colors"
        onClick={onHistoryOpen}
        aria-label="Open history"
      >
        <Clock size={18} />
      </button>

      {/* New Analysis button — changes style when result exists */}
      <AnimatePresence mode="wait">
        {hasResult ? (
          <motion.button
            key="reset"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={onNewAnalysis}
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 9999,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.2)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.1)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
            }}
          >
            <RotateCcw size={14} />
            New Analysis
          </motion.button>
        ) : (
          <motion.button
            key="new"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={onNewAnalysis}
          >
            <Plus size={16} />
            New Analysis
          </motion.button>
        )}
      </AnimatePresence>

      {/* Profile avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shrink-0"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Profile menu"
        >
          {initial}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-lg w-[200px] p-2 z-50">
            {/* User name */}
            <div className="text-sm text-white px-3 py-2">
              {userName || "User"}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 my-1" />

            {/* Plan badge */}
            <div className="text-xs text-indigo-400 px-3 py-1">{planLabel}</div>

            {/* Log out */}
            <div className="text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              Log out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
