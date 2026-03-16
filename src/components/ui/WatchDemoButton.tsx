import { useState, useEffect } from 'react';
import { Lock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LS_KEY = 'cutsheet_waitlist_email';
const UNLOCK_EVENT = 'cutsheet:waitlist-signup';

export default function WatchDemoButton() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => !!localStorage.getItem(LS_KEY));
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    const handler = () => {
      setUnlocked(true);
      setJustUnlocked(true);
      const timer = setTimeout(() => setJustUnlocked(false), 4000);
      return () => clearTimeout(timer);
    };
    window.addEventListener(UNLOCK_EVENT, handler);
    return () => window.removeEventListener(UNLOCK_EVENT, handler);
  }, []);

  if (unlocked) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => navigate('/demo')}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-150"
        >
          <Play size={14} className="text-indigo-400" />
          Watch Demo
        </button>
        {justUnlocked && (
          <span className="text-xs text-emerald-400 animate-fade-in">
            Demo unlocked!
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        disabled
        className="inline-flex items-center gap-2 text-sm text-zinc-600 cursor-not-allowed animate-[gentle-pulse_3s_ease-in-out_infinite]"
      >
        <Lock size={14} />
        Watch Demo
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Join waitlist to unlock
      </div>
    </div>
  );
}
