import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { submitWaitlist } from "../../services/waitlistService";

type Status = "idle" | "loading" | "success" | "error";

const LS_KEY = "cutsheet_waitlist_email";

interface EarlyAccessFormProps {
  placeholder?: string;
  buttonText?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function EarlyAccessForm({
  placeholder = "Enter your email",
  buttonText = "Get Early Access",
  size = "md",
  className = "",
}: EarlyAccessFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // localStorage is only used to persist the email after submission —
  // never auto-set success on mount so the form always starts fresh.

  function fireConfetti() {
    const end = Date.now() + 2 * 1000;
    const colors = ["#6366f1", "#8b5cf6", "#06b6d4", "#ffffff"];

    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      });
      requestAnimationFrame(frame);
    };
    frame();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    setStatus("loading");
    try {
      await submitWaitlist(trimmed);
      localStorage.setItem(LS_KEY, trimmed);
      setStatus("success");
      fireConfetti();
      window.dispatchEvent(new CustomEvent('cutsheet:waitlist-signup'));
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong — try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`inline-flex flex-col items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">
            You're on the list! We'll be in touch soon.
          </span>
        </div>
        <span className="text-xs text-emerald-400/60">
          Check your inbox for a confirmation.
        </span>
      </div>
    );
  }

  const isSm = size === "sm";

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className={
          isSm
            ? "flex flex-col gap-3"
            : "flex items-center"
        }
      >
        <div
          className={`flex items-center transition-colors focus-within:border-indigo-500/50 focus-within:bg-white/[0.07] ${
            isSm
              ? "w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              : "w-full max-w-md rounded-full border border-white/10 bg-white/5 backdrop-blur pl-5 pr-1.5 py-1.5"
          }`}
        >
          <input
            type="email"
            required
            placeholder={placeholder}
            value={email}
            disabled={status === "loading"}
            onChange={(e) => setEmail(e.target.value)}
            className={`bg-transparent text-sm text-white placeholder-zinc-500 outline-none disabled:opacity-50 ${
              isSm ? "w-full px-2 py-2" : "w-full min-w-0"
            }`}
          />

          {!isSm && (
            <div className="mx-2 h-5 w-px shrink-0 bg-white/10" />
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 bg-indigo-600 font-semibold text-white transition-all duration-150 ease-out hover:bg-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none ${
              isSm
                ? "w-full rounded-xl px-6 py-3 text-sm"
                : "rounded-full px-6 py-2.5 text-sm"
            }`}
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {buttonText}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
