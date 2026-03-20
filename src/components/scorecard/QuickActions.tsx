// QuickActions — bottom action buttons (policy check, generate brief, save ad)

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

interface QuickActionsProps {
  onCheckPolicies?: () => void;
  policyLoading?: boolean;
  onGenerateBrief?: () => void;
  onAddToSwipeFile?: () => void;
}

export function QuickActions({ onCheckPolicies, policyLoading, onGenerateBrief, onAddToSwipeFile }: QuickActionsProps) {
  const [toast, setToast] = useState<string | null>(null);

  if (!onGenerateBrief && !onAddToSwipeFile && !onCheckPolicies) return null;

  return (
    <>
      <div className="mt-auto p-5 border-t border-white/5 flex flex-col gap-2">
        {onCheckPolicies && (
          <button
            type="button"
            onClick={onCheckPolicies}
            disabled={policyLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b", fontSize: 14, fontWeight: 500,
              borderRadius: 12, width: "100%", padding: "10px 0",
              cursor: policyLoading ? "default" : "pointer",
              opacity: policyLoading ? 0.7 : 1,
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { if (!policyLoading) { e.currentTarget.style.background = "rgba(245,158,11,0.18)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
          >
            {policyLoading ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Checking policies...
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                Check Policies
              </>
            )}
          </button>
        )}
        {onGenerateBrief && (
          <button
            type="button"
            onClick={onGenerateBrief}
            className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
          >
            Generate Brief
          </button>
        )}
        {onAddToSwipeFile && (
          <button
            type="button"
            onClick={() => {
              onAddToSwipeFile();
              setToast("Saved to your library");
              setTimeout(() => setToast(null), 2500);
            }}
            className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
          >
            Save Ad
          </button>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#10B981", color: "white", padding: "8px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          animation: "fadeIn 200ms ease-out",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
