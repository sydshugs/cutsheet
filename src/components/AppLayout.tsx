// AppLayout.tsx — layout shell for all /app/* routes
import { useRef, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { UpgradeModal } from "./UpgradeModal";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import { useUsage } from "../hooks/useUsage";
import { useHistory, type HistoryEntry } from "../hooks/useHistory";
import { useSwipeFile, type SwipeItem } from "../hooks/useSwipeFile";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { themes } from "../theme";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

// ─── OUTLET CONTEXT TYPE ─────────────────────────────────────────────────────

export interface AppSharedContext {
  historyEntries: HistoryEntry[];
  addHistoryEntry: (entry: Omit<HistoryEntry, "id">) => void;
  deleteHistoryEntry: (id: string) => void;
  clearAllHistory: () => void;
  addSwipeItem: (item: Omit<SwipeItem, "id">) => void;
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
  usageCount: number;
  onUpgradeRequired: () => void;
  registerCallbacks: (
    cbs: { onNewAnalysis?: () => void; onHistoryOpen?: () => void; hasResult?: boolean } | null
  ) => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { usageCount, isPro, canAnalyze, increment, FREE_LIMIT } = useUsage();
  const { entries: historyEntries, addEntry: addHistoryEntry, deleteEntry: deleteHistoryEntry, clearAll: clearAllHistory } = useHistory();
  const { addItem: addSwipeItem } = useSwipeFile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts(
    () => setShowShortcuts(true),
    () => onNewAnalysisRef.current()
  );

  // TopBar delegates to whichever page is currently mounted
  const onNewAnalysisRef = useRef<() => void>(() => navigate("/app/paid"));
  const onHistoryOpenRef = useRef<() => void>(() => {});
  const [hasAnalysisResult, setHasAnalysisResult] = useState(false);

  const registerCallbacks = useCallback(
    (cbs: { onNewAnalysis?: () => void; onHistoryOpen?: () => void; hasResult?: boolean } | null) => {
      if (!cbs) {
        onNewAnalysisRef.current = () => navigate("/app/paid");
        onHistoryOpenRef.current = () => {};
        setHasAnalysisResult(false);
        return;
      }
      if (cbs.onNewAnalysis) onNewAnalysisRef.current = cbs.onNewAnalysis;
      if (cbs.onHistoryOpen) onHistoryOpenRef.current = cbs.onHistoryOpen;
      if (cbs.hasResult !== undefined) setHasAnalysisResult(cbs.hasResult);
    },
    [navigate]
  );

  const ctx: AppSharedContext = {
    historyEntries,
    addHistoryEntry,
    deleteHistoryEntry,
    clearAllHistory,
    addSwipeItem,
    canAnalyze,
    isPro,
    increment,
    FREE_LIMIT,
    usageCount,
    onUpgradeRequired: () => setShowUpgradeModal(true),
    registerCallbacks,
  };

  const userEmail = user?.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090b" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={userEmail}
        isPro={isPro}
        usageCount={usageCount}
        FREE_LIMIT={FREE_LIMIT}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          onNewAnalysis={() => onNewAnalysisRef.current()}
          onHistoryOpen={() => onHistoryOpenRef.current()}
          onMobileMenuToggle={() => setMobileOpen((p) => !p)}
          showMobileMenu={mobileOpen}
          userName={userEmail}
          userPlan={isPro ? "pro" : "free"}
          hasResult={hasAnalysisResult}
          onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }}
        />
        <main className="flex-1 overflow-auto">
          <Outlet context={ctx} />
        </main>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={themes.dark} />
      )}
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
