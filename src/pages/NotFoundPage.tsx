import { Helmet } from 'react-helmet-async';
import { motion } from "framer-motion";
import { Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";

const PRIMARY_ORB_HORIZONTAL_OFFSET = 40;
const PRIMARY_ORB_VERTICAL_OFFSET = 20;

export default function NotFoundPage() {
  return (
    <div className="w-full relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "#09090b", color: "#fff" }}>
      <Helmet>
        <title>Page Not Found — Cutsheet</title>
        <link rel="canonical" href="https://cutsheet.xyz/404" />
      </Helmet>
      {/* Ambient orbs matching landing page */}
      <div aria-hidden={true} className="-z-10 absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, PRIMARY_ORB_HORIZONTAL_OFFSET, -PRIMARY_ORB_HORIZONTAL_OFFSET, 0],
            y: [0, PRIMARY_ORB_VERTICAL_OFFSET, -PRIMARY_ORB_VERTICAL_OFFSET, 0],
            rotate: [0, 10, -10, 0],
          }}
          className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "rgba(99,102,241,0.2)" }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 5,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            x: [0, -PRIMARY_ORB_HORIZONTAL_OFFSET, PRIMARY_ORB_HORIZONTAL_OFFSET, 0],
            y: [0, -PRIMARY_ORB_VERTICAL_OFFSET, PRIMARY_ORB_VERTICAL_OFFSET, 0],
          }}
          className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgba(99,102,241,0.1)" }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 5,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tighter" style={{ color: "#f4f4f5" }}>
          404
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-md leading-relaxed">
          The page you're looking for might have been<br />
          moved or doesn't exist.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity"
            style={{ background: "#6366f1" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            <Compass className="h-4 w-4" />
            Open App
          </Link>
        </div>
      </div>
    </div>
  );
}
