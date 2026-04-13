import { Helmet } from 'react-helmet-async';
import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetHero from "../components/ui/cutsheet-hero";
import CutsheetTheDifference from "../components/ui/cutsheet-the-difference";
import CutsheetHowItWorks from "../components/ui/cutsheet-how-it-works";
import CutsheetWhy from "../components/ui/cutsheet-why";
import CutsheetPlatform from "../components/ui/cutsheet-platform";
import CutsheetPricing from "../components/ui/cutsheet-pricing";
import CutsheetCTA from "../components/ui/cutsheet-cta";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Helmet>
        <title>Cutsheet — AI Ad Creative Analyzer</title>
        <meta name="description" content="Score your paid ads and organic content in 30 seconds. AI-powered analysis for Meta, TikTok, Google, and YouTube. Free to start." />
        <meta property="og:title" content="Cutsheet — AI Ad Creative Analyzer" />
        <meta property="og:description" content="Score your paid ads and organic content in 30 seconds. AI-powered analysis for Meta, TikTok, Google, and YouTube. Free to start." />
        <meta property="og:url" content="https://cutsheet.xyz" />
        <meta property="og:image" content="https://cutsheet.xyz/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://cutsheet.xyz" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Cutsheet",
          "description": "AI-powered ad creative analyzer. Score paid ads and organic content in 30 seconds with actionable feedback.",
          "url": "https://cutsheet.xyz",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": [
            { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
            { "@type": "Offer", "price": "29", "priceCurrency": "USD", "name": "Pro", "billingIncrement": "P1M" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Cutsheet",
          "url": "https://cutsheet.xyz",
          "logo": "https://cutsheet.xyz/cutsheet-logo-clear.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "hello@cutsheet.xyz",
            "contactType": "customer support"
          }
        })}</script>
      </Helmet>
      <CutsheetNav />
      <CutsheetHero />
      <CutsheetTheDifference />
      <CutsheetHowItWorks />
      <CutsheetWhy />
      <CutsheetPlatform />
      <CutsheetPricing />
      <CutsheetCTA />
      <CutsheetFooter />
    </div>
  );
}
