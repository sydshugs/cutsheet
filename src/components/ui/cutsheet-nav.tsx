import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Landing nav — floating pill, dark theme */
export default function CutsheetNav() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 4 : 8,
        padding: isMobile ? "6px 8px" : "8px 12px",
        borderRadius: 9999,
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 1px 20px rgba(0,0,0,0.3)",
        backgroundColor: scrolled
          ? "rgba(9,9,11,0.8)"
          : "rgba(255,255,255,0.03)",
        transition: "background-color 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          paddingLeft: 8,
          paddingRight: 4,
          outline: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <img
          src="/cutsheet-logo-clear.png"
          alt=""
          aria-hidden="true"
          style={{ height: 20, width: "auto", display: "block" }}
        />
        <span
          style={{
            fontFamily: "'TBJ Interval', var(--sans)",
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "0.2px",
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          cutsheet
        </span>
      </Link>

      {/* Nav links — hidden on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NavLink onClick={() => scrollTo("#how-it-works")}>Features</NavLink>
          <NavLink onClick={() => scrollTo("#pricing")}>Pricing</NavLink>
        </div>
      )}

      {/* CTA */}
      <a
        href="mailto:hello@cutsheet.xyz"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: isMobile ? 4 : 8,
          padding: isMobile ? "6px 12px" : "8px 20px",
          borderRadius: 9999,
          backgroundColor: "#6366f1",
          color: "#fff",
          fontSize: isMobile ? 12 : 14,
          fontWeight: 500,
          fontFamily: "var(--sans)",
          textDecoration: "none",
          lineHeight: 1,
          transition: "background-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#4f46e5";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 8px 20px rgba(99,102,241,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#6366f1";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
        }}
      >
        Contact Us
        {!isMobile && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowRight size={12} strokeWidth={2.5} />
          </span>
        )}
      </a>
    </nav>
  );
}

function NavLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 16px",
        borderRadius: 9999,
        fontSize: 14,
        fontFamily: "var(--sans)",
        fontWeight: 400,
        color: hovered ? "#fff" : "#a1a1aa",
        backgroundColor: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        transition: "color 0.2s ease, background-color 0.2s ease",
        lineHeight: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
