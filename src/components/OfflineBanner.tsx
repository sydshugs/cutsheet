// OfflineBanner.tsx — Persistent banner when user goes offline

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      padding: "8px 16px",
      background: "rgba(239,68,68,0.08)",
      borderBottom: "1px solid rgba(239,68,68,0.2)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
    }}>
      <WifiOff size={14} color="#ef4444" />
      <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>You're offline</span>
      <span style={{ fontSize: 12, color: "#a1a1aa" }}>· Results are still visible. Reconnect to run new analyses</span>
    </div>
  );
}
