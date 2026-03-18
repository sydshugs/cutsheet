// ABTestPage.tsx — Thin wrapper for PreFlightView (A/B testing)

import { Helmet } from 'react-helmet-async';
import { PreFlightView } from "../../components/PreFlightView";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export default function ABTestPage() {
  return (
    <>
      <Helmet>
        <title>Pre-Flight A/B Test — Cutsheet</title>
        <meta name="description" content="Test two ad variants before spending. Get a scored comparison and recommendation." />
        <link rel="canonical" href="https://cutsheet.xyz/app/ab-test" />
      </Helmet>
      <PreFlightView isDark={true} apiKey={API_KEY} />
    </>
  );
}
