import { motion } from "framer-motion";
import { Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";

const PRIMARY_ORB_HORIZONTAL_OFFSET = 40;
const PRIMARY_ORB_VERTICAL_OFFSET = 20;

export default function NotFoundPage() {
  return (
    <div className="w-full relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-white">
      {/* Ambient orbs matching landing page */}
      <div aria-hidden={true} className="-z-10 absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, PRIMARY_ORB_HORIZONTAL_OFFSET, -PRIMARY_ORB_HORIZONTAL_OFFSET, 0],
            y: [0, PRIMARY_ORB_VERTICAL_OFFSET, -PRIMARY_ORB_VERTICAL_OFFSET, 0],
            rotate: [0, 10, -10, 0],
          }}
          className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 blur-3xl"
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
          className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-400/10 blur-3xl"
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 5,
            ease: "easeInOut",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tighter bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-md leading-relaxed">
          The page you're looking for might have been<br />
          moved or doesn't exist.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-600/25"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
          >
            <Compass className="h-4 w-4" />
            Open App
          </Link>
        </div>
      </div>
    </div>
  );
}
