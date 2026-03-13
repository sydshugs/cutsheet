import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <CutsheetNav />

      <main className="mx-auto max-w-3xl px-8 py-24">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: March 12, 2026</p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Acceptance</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          By using Cutsheet, you agree to these terms. If you do not agree, do not
          use the service.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">What Cutsheet Is</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Cutsheet is an AI-powered ad creative analysis tool. It provides scores and
          feedback on video and static ad creatives using AI models. Scores are
          advisory — they are not guarantees of ad performance.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Acceptable Use</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You may use Cutsheet to analyze ad creatives you own or have rights to
          analyze. You may not use Cutsheet to analyze content you do not have
          rights to, to attempt to reverse-engineer our AI models, to submit
          illegal or harmful content, or to resell or redistribute Cutsheet's
          analysis output as your own product.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Intellectual Property</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Cutsheet and its underlying technology are owned by Shug Studio LLC.
          Your uploaded creatives remain your property. Analysis output generated
          by Cutsheet may be used freely by you for your own purposes.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Disclaimers</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Cutsheet is provided "as is." AI analysis scores are probabilistic
          estimates, not guarantees. We are not liable for advertising decisions
          made based on Cutsheet output.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Limitation of Liability</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Shug Studio LLC's liability to you for any claim arising from use of
          Cutsheet is limited to the amount you paid us in the 12 months prior
          to the claim, or $100, whichever is greater.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Changes to Terms</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We may update these terms at any time. Continued use of Cutsheet after
          changes constitutes acceptance of the new terms.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Contact</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          For questions:{" "}
          <a href="mailto:hello@cutsheet.xyz" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            hello@cutsheet.xyz
          </a>
          <br />
          Shug Studio LLC, Wyoming
        </p>
      </main>

      <CutsheetFooter />
    </div>
  );
}
