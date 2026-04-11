// ABTestPage.tsx — Thin wrapper for PreFlightView (A/B testing)

import { Helmet } from 'react-helmet-async';
import { PreFlightView } from "../../components/PreFlightView";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

export default function ABTestPage() {
  return (
    <>
      <Helmet>
        <title>A/B Test — Cutsheet</title>
        <meta name="description" content="Upload two variants. AI compares hooks, CTAs, and pacing to predict the winner." />
        <link rel="canonical" href="https://cutsheet.xyz/app/ab-test" />
      </Helmet>
      <h1 className="sr-only">A/B Test</h1>
      <PreFlightView apiKey={API_KEY} />
    </>
  );
}
