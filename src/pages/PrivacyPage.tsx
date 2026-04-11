import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      <CutsheetNav />

      <main className="mx-auto max-w-3xl px-8 py-24">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: March 25, 2026</p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">What We Collect</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We collect your email address when you sign up. When you use the Cutsheet app,
          we process ad creatives you upload for the purpose of generating analysis scores.
          We also collect usage data (pages visited, features used) to improve the product.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">How We Use It</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your data is used to provide the service and improve analysis quality.
          We do not sell your data to third parties.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">AI Processing</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Ad creatives you upload are processed by Google Gemini and Anthropic Claude APIs
          to generate your analysis results. These services may retain data per their own
          privacy policies.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Data Storage</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your account data and analysis results are stored securely in Supabase.
          Uploaded ad creatives are deleted within 24 hours of analysis completion.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Cookies &amp; Local Storage</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We use browser local storage for authentication sessions (via Supabase).
          We do not use third-party tracking cookies.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Your Rights</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You can delete your account and all associated data at any time from your
          Settings page. We will respond to data deletion requests within 30 days.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Contact</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          For privacy questions:{" "}
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
