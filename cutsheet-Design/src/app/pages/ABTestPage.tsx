import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GitBranch, 
  CloudUpload, 
  Trophy, 
  CheckCircle, 
  Zap, 
  FileDown, 
  RotateCcw, 
  Bookmark,
  ChevronLeft
} from "lucide-react";

type TestState = 'idle' | 'loading' | 'results';

export default function ABTestPage() {
  const [testState, setTestState] = useState<TestState>('idle');
  const [activeMode, setActiveMode] = useState("Full Creative");
  const [filesSelected, setFilesSelected] = useState(false);
  const [loadingText, setLoadingText] = useState("Extracting visual features...");

  const imgA = "https://images.unsplash.com/photo-1657289174053-fc19f9fd9aab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRpYyUyMG1hbiUyMGluJTIwZ3ltJTIwcnVubmluZyUyMHZlcnRpY2FsfGVufDF8fHx8MTc3NDcwOTU2OHww&ixlib=rb-4.1.0&q=80&w=1080";
  const imgB = "https://images.unsplash.com/photo-1663146718443-e643ee509302?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRpYyUyMHdvbWFuJTIwb3V0c2lkZSUyMHJ1bm5pbmclMjB2ZXJ0aWNhbHxlbnwxfHx8fDE3NzQ3MDk1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080";

  useEffect(() => {
    if (testState === 'loading') {
      const phases = [
        "Extracting visual features...",
        "Analyzing hook structure...",
        "Comparing retention probabilities...",
        "Finalizing test results..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if(i < phases.length) setLoadingText(phases[i]);
      }, 1500);
      
      const timeout = setTimeout(() => setTestState('results'), 6000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [testState]);

  const handleRunTest = () => setTestState('loading');
  const handleReset = () => {
    setTestState('idle');
    setFilesSelected(false);
    setLoadingText("Extracting visual features...");
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-[#10b981]';
    if (score >= 5) return 'bg-[#f59e0b]';
    return 'bg-[#ef4444]';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 7) return 'text-[#10b981]';
    if (score >= 5) return 'text-[#f59e0b]';
    return 'text-[#ef4444]';
  };

  const metrics = [
    { label: 'Hook', a: 9.2, b: 5.8, winner: 'a', highlight: 'Biggest Gap' },
    { label: 'Message', a: 8.0, b: 7.2, winner: 'a' },
    { label: 'CTA', a: 8.8, b: 4.9, winner: 'a' },
    { label: 'Production', a: 7.4, b: 8.6, winner: 'b' },
    { label: 'Visual', a: 8.2, b: 6.8, winner: 'a' },
  ];

  return (
    <div className="flex-1 flex flex-col relative bg-[#09090b] min-h-0 overflow-y-auto font-['Geist',sans-serif]">
      {/* Radial glow — rose (idle/loading states only) */}
      {testState !== 'results' && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(236,72,153,0.08) 0%, transparent 70%)" }}
        />
      )}

      {/* --- IDLE STATE --- */}
      {testState === 'idle' && (
        <div className="w-full max-w-[640px] mx-auto flex flex-col items-center my-auto py-20 px-6 relative z-10">
          <div className="w-[76px] h-[76px] rounded-2xl bg-rose-500/[0.1] border border-rose-500/20 flex items-center justify-center shrink-0 mb-8">
            <GitBranch size={32} className="text-rose-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-[40px] font-semibold text-white tracking-[-0.025em] text-center leading-[1.1] mb-4">
            Run an A/B Test
          </h1>
          <p className="text-[14px] text-zinc-400 text-center max-w-[420px] leading-[1.6] mb-5">
            Upload two variants. Our AI extracts visual features, pacing, and hooks to predict the undisputed winner.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {["Hook comparison", "CTA analysis", "Winner prediction"].map((label) => (
              <span
                key={label}
                className="rounded-full border px-3 py-1 text-xs text-rose-400"
                style={{ background: "rgba(236,72,153,0.08)", borderColor: "rgba(236,72,153,0.2)" }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Dropzone A */}
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 text-center">Variant A</div>
              <div 
                onClick={() => setFilesSelected(true)}
                className={`rounded-2xl border ${filesSelected ? 'border-indigo-500/30 bg-indigo-500/[0.02]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'} flex flex-col items-center justify-center min-h-[280px] cursor-pointer transition-all relative overflow-hidden`}
              >
                {filesSelected ? (
                  <img src={imgA} alt="A" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <CloudUpload size={20} className="text-zinc-500 mb-3" />
                    <div className="text-sm text-zinc-400 mb-1.5">Upload video</div>
                    <div className="text-xs text-zinc-600">MP4 · MOV · JPG</div>
                  </div>
                )}
              </div>
            </div>

            {/* Dropzone B */}
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 text-center">Variant B</div>
              <div 
                onClick={() => setFilesSelected(true)}
                className={`rounded-2xl border ${filesSelected ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'} flex flex-col items-center justify-center min-h-[280px] cursor-pointer transition-all relative overflow-hidden`}
              >
                {filesSelected ? (
                  <img src={imgB} alt="B" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <CloudUpload size={20} className="text-zinc-500 mb-3" />
                    <div className="text-sm text-zinc-400 mb-1.5">Upload video</div>
                    <div className="text-xs text-zinc-600">MP4 · MOV · JPG</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center mt-10">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 text-center">Test Type</div>
            <div className="flex items-center justify-center gap-2">
              {["Hook Battle", "CTA Showdown", "Full Creative"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`h-[28px] rounded-[9999px] px-4 text-[12px] font-medium transition-colors ${
                    mode === activeMode 
                      ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                      : "bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!filesSelected}
            onClick={handleRunTest}
            className={`mt-10 h-[40px] px-8 rounded-[10px] text-[13px] font-medium transition-colors w-full max-w-[240px] ${
              filesSelected ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
            }`}
          >
            Run Comparison
          </button>
        </div>
      )}

      {/* --- LOADING STATE --- */}
      {testState === 'loading' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-[calc(100vh-56px)] w-full flex flex-col items-center justify-center px-6 relative z-10"
        >
          {/* Center Hero */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-[64px] h-[64px] rounded-2xl bg-rose-500/[0.12] border border-rose-500/20 flex items-center justify-center mb-6">
              <GitBranch size={24} className="text-rose-400" />
            </div>
            <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-[-0.025em]">Comparing Creatives</h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto mb-10">
            {/* Variant A */}
            <div className="relative aspect-[4/5] rounded-[16px] overflow-hidden border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)] group">
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-[16px] animate-pulse pointer-events-none z-20" />
              <img src={imgA} alt="Variant A" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-[#09090b]/50 flex items-center justify-center z-10">
                <div className="w-[40px] h-[40px] rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
              
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-[#09090b]/80 backdrop-blur-md text-indigo-400 text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-[8px] border border-indigo-500/30 flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.10)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Analyzing...
                </span>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <span className="text-[12px] font-medium text-white drop-shadow-md truncate pr-2">variant-a-final.mp4</span>
                <span className="bg-white/10 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-[4px] border border-white/10">MP4</span>
              </div>
            </div>
            
            {/* Variant B */}
            <div className="relative aspect-[4/5] rounded-[16px] overflow-hidden border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)] group">
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-[16px] animate-pulse pointer-events-none z-20" />
              <img src={imgB} alt="Variant B" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-[#09090b]/50 flex items-center justify-center z-10">
                <div className="w-[40px] h-[40px] rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
              
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-[#09090b]/80 backdrop-blur-md text-indigo-400 text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-[8px] border border-indigo-500/30 flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.10)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Analyzing...
                </span>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <span className="text-[12px] font-medium text-white drop-shadow-md truncate pr-2">variant-b-v2.mp4</span>
                <span className="bg-white/10 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-[4px] border border-white/10">MP4</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[13px] text-zinc-400 font-medium">2 of 2 analyzing</span>
            </div>
            <div className="w-full h-[6px] bg-white/[0.04] rounded-full overflow-hidden mb-3">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-full rounded-full"
                style={{ background: "#6366f1" }}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.span 
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-indigo-400 mb-6"
              >
                {loadingText}
              </motion.span>
            </AnimatePresence>
            <button onClick={handleReset} className="text-[13px] text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-500/30 hover:decoration-zinc-300 transition-colors">
              Stop after current
            </button>
          </div>
        </motion.div>
      )}

      {/* --- RESULTS STATE --- */}
      {testState === 'results' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[1000px] mx-auto px-6 pt-12 pb-24"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-16">
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="w-10 h-10 rounded-[10px] border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-[24px] font-semibold text-white tracking-tight">Test Results</h1>
                <span className="text-[13px] text-zinc-500">{activeMode} • 2 Variants</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-[40px] px-4 rounded-[10px] bg-transparent border border-white/[0.06] text-zinc-400 text-[13px] font-medium hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-2">
                <FileDown size={16} /> Export PDF
              </button>
            </div>
          </div>

          {/* Winner Announcement */}
          <div className="flex flex-col items-center mb-24 text-center">
            <div className="flex items-end justify-center gap-6 md:gap-16 w-full">
              
              {/* Loser - Variant B */}
              <div className="flex flex-col items-center opacity-50 hover:opacity-100 transition-opacity translate-y-6">
                <div className="w-[160px] md:w-[220px] aspect-[4/5] rounded-[16px] overflow-hidden border border-white/[0.06] mb-4">
                  <img src={imgB} alt="Variant B" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="text-[12px] font-medium text-zinc-500 mb-1">Variant B</div>
                <div className="text-[28px] font-bold text-[#f59e0b] tracking-tight leading-none">
                  6.1<span className="text-[14px] font-normal text-zinc-600">/10</span>
                </div>
              </div>

              {/* Winner - Variant A */}
              <div className="flex flex-col items-center relative z-10">
                {/* Massive Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-emerald-500/15 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Trophy size={14} /> Winner
                </div>

                <div className="w-[240px] md:w-[320px] aspect-[4/5] rounded-[16px] overflow-hidden border-2 border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] mb-6 relative group">
                  <img src={imgA} alt="Variant A" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 w-full text-center">
                    <div className="text-[64px] font-bold text-[#10b981] leading-none tracking-tight drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      8.4
                    </div>
                  </div>
                </div>
                
                <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-[-0.025em] leading-none">
                  Variant A
                </h2>
              </div>

            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="mb-20">
            <h3 className="text-[20px] font-semibold text-white mb-10 text-center">Head-to-head metrics</h3>
            <div className="flex flex-col gap-5 max-w-[800px] mx-auto">
              {metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-4 md:gap-8 group">
                  {/* Variant A Bar */}
                  <div className="flex-1 flex items-center justify-end gap-4 relative">
                    {m.highlight && (
                      <div className="absolute right-full mr-4 whitespace-nowrap hidden md:block">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-[4px] border border-emerald-500/20">
                          {m.highlight}
                        </span>
                      </div>
                    )}
                    <span className={`font-mono text-[16px] md:text-[18px] font-bold ${getScoreTextColor(m.a)}`}>
                      {m.a.toFixed(1)}
                    </span>
                    <div className="w-full max-w-[280px] h-2 bg-white/[0.04] rounded-full overflow-hidden flex justify-end">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${m.a * 10}%` }}
                        className={`h-full ${getScoreColor(m.a)} rounded-full`} 
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Label */}
                  <div className="w-[100px] md:w-[120px] text-center flex flex-col items-center justify-center shrink-0">
                    <span className="text-[14px] font-medium text-white">{m.label}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ${m.winner === 'a' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                      {m.winner === 'a' ? 'A WINS' : 'B WINS'}
                    </span>
                  </div>

                  {/* Variant B Bar */}
                  <div className="flex-1 flex items-center justify-start gap-4">
                    <div className="w-full max-w-[280px] h-2 bg-white/[0.04] rounded-full overflow-hidden flex justify-start">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${m.b * 10}%` }}
                        className={`h-full ${getScoreColor(m.b)} rounded-full`} 
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                    <span className={`font-mono text-[16px] md:text-[18px] font-bold ${getScoreTextColor(m.b)}`}>
                      {m.b.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-[16px] bg-emerald-500/[0.03] border border-emerald-500/20 p-6 md:p-8 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-500">Recommendation</span>
              </div>
              <h3 className="text-[24px] font-semibold text-white mb-3 leading-tight tracking-tight">Variant A wins decisively.</h3>
              <p className="text-[14px] text-zinc-400 leading-[1.6]">
                The hook differential alone (9.2 vs 5.8) is enough to justify running A. B has better production quality — worth isolating that element in the next test.
              </p>
            </div>

            <div className="rounded-[16px] bg-indigo-500/[0.03] border border-indigo-500/20 p-6 md:p-8 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-400">Hybrid Opportunity</span>
              </div>
              <h3 className="text-[24px] font-semibold text-white mb-3 leading-tight tracking-tight">Create Version C</h3>
              <p className="text-[14px] text-zinc-400 leading-[1.6]">
                Consider a <strong className="text-white font-medium">Version C</strong> that takes A's highly effective hook structure and pairs it with B's superior production quality.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-end gap-4 pt-8 border-t border-white/[0.06]">
            <button onClick={handleReset} className="h-[40px] px-6 rounded-[10px] bg-transparent border border-white/[0.06] text-zinc-400 text-[13px] font-medium hover:text-white hover:bg-white/[0.02] transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
              <RotateCcw size={16} /> Run Another Test
            </button>
            <button className="h-[40px] px-8 rounded-[10px] bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 w-full md:w-auto">
              <Bookmark size={16} /> Save Winner to Library
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
}