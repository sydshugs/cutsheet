import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CutsheetNav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Only hide after scrolling past 60px, show immediately on scroll up
        if (y > 60 && y > lastY.current) {
          setHidden(true);
        } else {
          setHidden(false);
        }
        setScrolled(y > 20);
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const location = useLocation();
  const waitlistHref = location.pathname === "/" ? "#waitlist" : "/#waitlist";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ease-out ${
        scrolled
          ? "border-b border-white/[0.08] bg-zinc-950/90 shadow-lg shadow-black/20"
          : "border-b border-transparent bg-zinc-950/40"
      }`}
      style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/cutsheet-logo.png" alt="Cutsheet" className="h-[23px] w-[23px]" />
          <span
            className="text-white"
            style={{ fontFamily: "'TBJ Interval', monospace", fontSize: "20px" }}
          >
            cutsheet
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <a
            href={waitlistHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <span className="hidden md:inline">Get Early Access</span>
            <span className="md:hidden">Join Waitlist</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
