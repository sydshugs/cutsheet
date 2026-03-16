import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetHero from "../components/ui/cutsheet-hero";
import CutsheetHowItWorks from "../components/ui/cutsheet-how-it-works";
import CutsheetWhy from "../components/ui/cutsheet-why";
import CutsheetFeatures from "../components/ui/cutsheet-features";
import CutsheetTestimonials from "../components/ui/cutsheet-testimonials";
import CutsheetPricing from "../components/ui/cutsheet-pricing";
import CutsheetFAQ from "../components/ui/cutsheet-faq";
import CutsheetCTA from "../components/ui/cutsheet-cta";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <CutsheetNav />
      <CutsheetHero />
      <CutsheetHowItWorks />
      <CutsheetFeatures />
      <CutsheetTestimonials />
      <CutsheetWhy />
      <CutsheetPricing />
      <CutsheetFAQ />
      <CutsheetCTA />
      <CutsheetFooter />
    </div>
  );
}
