// ABTestPage.tsx — Thin wrapper for PreFlightView (A/B testing)

import { PreFlightView } from "../../components/PreFlightView";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export default function ABTestPage() {
  return <PreFlightView isDark={true} apiKey={API_KEY} />;
}
