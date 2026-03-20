// TopBar.tsx — top bar for the main content area

import { useEffect, useRef, useState } from "react";
import { Clock, Menu, Plus, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarProps {
  onNewAnalysis: () => void;
  onHistoryOpen: () => void;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  userName?: string;
  userPlan?: string;
  hasResult?: boolean;
  historyCount?: number;
  onLogout?: () => void;
}

export function TopBar({
  onNewAnalysis,
  onHistoryOpen,
  onMobileMenuToggle,
  userName,
  userPlan,
  hasResult,
  historyCount,
  onLogout,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";
  const planLabel = userPlan === "team" ? "Team" : userPlan === "pro" ? "Pro" : "Free";

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
    </div>
  );
}
