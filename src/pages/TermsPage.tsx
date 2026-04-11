import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      <CutsheetNav />

      <main className="mx-auto max-w-3xl px-8 py-24">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: March 25, 2026</p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">The Service</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Cutsheet is provided as-is for ad creative analysis. Scores and feedback
          are advisory — they are not guarantees of ad performance.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Your Content</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You own your uploaded content. By uploading, you grant Cutsheet a limited
          license to process your creatives solely for the purpose of generating
          your analysis results.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Acceptable Use</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Don't use Cutsheet for illegal content. We may suspend or terminate accounts that
          abuse the service or violate these terms.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Age Requirement</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You must be 18 years or older to use Cutsheet.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Billing</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Subscription billing is handled via Stripe. You can cancel your
          subscription at any time — your access continues until the end of the
          billing period. For refund requests, contact{" "}
          <a
            href="mailto:hello@cutsheet.ai"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            hello@cutsheet.ai
          </a>{" "}
          within 7 days of your charge.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Governing Law</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          These terms are governed by the laws of New York, USA.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Contact</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          For questions:{" "}
          <a
            href="mailto:hello@cutsheet.ai"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            hello@cutsheet.ai
          </a>
        </p>
      </main>

      <CutsheetFooter />
    </div>
  );
}
