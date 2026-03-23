// AppLayout.tsx — layout shell for all /app/* routes
import { useRef, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { UpgradeModal } from "./UpgradeModal";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import { useUsage } from "../hooks/useUsage";
import { type HistoryEntry } from "../hooks/useHistory";
import { useSupabaseHistory } from "../hooks/useSupabaseHistory";
import { useSwipeFile, type SwipeItem } from "../hooks/useSwipeFile";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { themes } from "../theme";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { OfflineBanner } from "./OfflineBanner";
import { Helmet } from "react-helmet-async";

// ─── OUTLET CONTEXT TYPE ─────────────────────────────────────────────────────

export interface AppSharedContext {
  historyEntries: HistoryEntry[];
  // addHistoryEntry is a no-op refresh trigger — pages save via saveAnalysis() directly.
  addHistoryEntry: (entry?: Partial<Omit<HistoryEntry, "id">>) => void;
  deleteHistoryEntry: (id: string) => void;
  clearAllHistory: () => void;
  addSwipeItem: (item: Omit<SwipeItem, "id">) => void;
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
  usageCount: number;
  onUpgradeRequired: (feature?: string) => void;
  registerCallbacks: (
    cbs: { onNewAnalysis?: () => void; onHistoryOpen?: () => void; hasResult?: boolean } | null
  ) => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { usageCount, isPro, isTeam, tier, canAnalyze, increment, FREE_LIMIT } = useUsage();
  const {
    entries: historyEntries,
    refresh: refreshHistory,
    deleteEntry: deleteHistoryEntry,
    clearAll: clearAllHistory,
  } = useSupabaseHistory();

  // Pages call saveAnalysis() directly; this triggers a Supabase re-fetch.
  const addHistoryEntry = useCallback(async (_entry?: Partial<Omit<HistoryEntry, "id">>) => {
    await refreshHistory();
  }, [refreshHistory]);
  const { addItem: addSwipeItem } = useSwipeFile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureKey, setUpgradeFeatureKey] = useState<string | undefined>(undefined);
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
    onUpgradeRequired: (feature?: string) => {
      setUpgradeFeatureKey(feature);
      setShowUpgradeModal(true);
    },
    registerCallbacks,
  };

  const userEmail = user?.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090b" }}>
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 8,
          zIndex: 999,
          background: "#6366f1",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
        }}
        onFocus={(e) => { e.currentTarget.style.left = "8px"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; }}
      >
        Skip to main content
      </a>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={userEmail}
        isPro={isPro}
        isTeam={isTeam}
        usageCount={usageCount}
        FREE_LIMIT={FREE_LIMIT}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <OfflineBanner />
        <TopBar
          onNewAnalysis={() => onNewAnalysisRef.current()}
          onHistoryOpen={() => onHistoryOpenRef.current()}
          onMobileMenuToggle={() => setMobileOpen((p) => !p)}
          showMobileMenu={mobileOpen}
          userName={userEmail}
          userPlan={tier}
          hasResult={hasAnalysisResult}
          onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }}
        />
        <main id="main-content" className="flex-1 flex flex-col overflow-auto pb-[68px] md:pb-0">
          <Outlet context={ctx} />
        </main>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          featureKey={upgradeFeatureKey}
          onClose={() => {
            setShowUpgradeModal(false);
            setUpgradeFeatureKey(undefined);
          }}
        />
      )}
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
