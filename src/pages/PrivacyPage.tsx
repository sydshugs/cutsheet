import CutsheetNav from "../components/ui/cutsheet-nav";
import CutsheetFooter from "../components/ui/cutsheet-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <CutsheetNav />

      <main className="mx-auto max-w-3xl px-8 py-24">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: March 12, 2026</p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">What We Collect</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          When you sign up for the Cutsheet waitlist, we collect your email address.
          When you use the Cutsheet app, we process video and image files you upload
          for the purpose of generating creative analysis. We do not store your uploaded
          files after analysis is complete. We collect basic usage data (pages visited,
          features used) to improve the product.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">How We Use Your Data</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We use your email address to send waitlist updates and product announcements.
          We use uploaded creative files solely to generate your analysis scorecard —
          files are processed and immediately discarded. We do not sell your data to
          third parties.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Third-Party Services</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          Cutsheet uses the following third-party services:
        </p>
        <ul className="text-sm text-zinc-400 leading-relaxed list-disc list-inside space-y-1">
          <li>Google Gemini API — for AI-powered creative analysis</li>
          <li>Loops.so — for email communication</li>
          <li>Vercel — for hosting and infrastructure</li>
          <li>Cloudflare — for DNS and security</li>
        </ul>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Data Retention</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Email addresses are retained until you unsubscribe or request deletion.
          Uploaded files are not retained after analysis. Analysis results are stored
          locally in your browser (localStorage) and are not transmitted to our servers.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Your Rights</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You may request deletion of your data at any time by emailing{" "}
          <a href="mailto:hello@cutsheet.xyz" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            hello@cutsheet.xyz
          </a>
          . We will respond within 30 days.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Cookies</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Cutsheet uses no tracking cookies. We use localStorage for saving your
          analysis history locally on your device.
        </p>

        <h2 className="text-lg font-semibold text-white mt-10 mb-3">Contact</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          For privacy questions:{" "}
          <a href="mailto:hello@cutsheet.xyz" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            hello@cutsheet.xyz
          </a>
        </p>
      </main>

      <CutsheetFooter />
    </div>
  );
}
