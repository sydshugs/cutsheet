import React, { useState, useEffect } from "react";
import { Monitor, CheckCircle2, X } from "lucide-react";

const subtitles = [
  "Detecting banner format...",
  "Checking brand presence...",
  "Scoring placement fit...",
  "Analyzing platform best practices...",
  "Finalizing scorecard...",
];

const dimensions = [
  "Hook Strength",
  "Message Clarity",
  "CTA Effectiveness",
  "Production Quality",
];

interface DisplayLoadingStateProps {
  onComplete?: () => void;
}

export default function DisplayLoadingState({ onComplete }: DisplayLoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const advance = (step: number) => {
      if (step > 4) return;
      setCurrentStep(step);

      const delays = [3000, 2500, 3500, 2500, 2000];
      if (step < 4) {
        timeout = setTimeout(() => advance(step + 1), delays[step]);
      } else {
        timeout = setTimeout(() => onComplete?.(), delays[step]);
      }
    };

    timeout = setTimeout(() => advance(0), 600);
    return () => clearTimeout(timeout);
  }, []);

  const getDimensionState = (dimIndex: number) => {
    if (dimIndex === 0) {
      if (currentStep === 0) return "progress";
      if (currentStep > 0) return "complete";
      return "pending";
    }
    if (dimIndex === 1) {
      if (currentStep === 1) return "progress";
      if (currentStep > 1) return "complete";
      return "pending";
    }
    if (dimIndex === 2) {
      if (currentStep === 2) return "progress";
      if (currentStep > 2) return "complete";
      return "pending";
    }
    if (dimIndex === 3) {
      if (currentStep === 3 || currentStep === 4) return "progress";
      if (currentStep >= 5) return "complete";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 font-['Geist',sans-serif]">
      <div className="flex w-full max-w-3xl bg-[#18181b] border border-white/[0.06] rounded-[16px] p-1.5 mx-auto">

        {/* Left Column (60%) */}
        <div className="relative w-[60%] h-full rounded-[12px] overflow-hidden bg-[#09090b] shrink-0" style={{ minHeight: 460 }}>
          <img
            src="https://images.unsplash.com/photo-1773558057687-cf2348c40929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMG9pbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzc0NjM1MDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Display ad thumbnail"
            className="absolute inset-0 w-full h-full object-cover opacity-90 mx-[-42px] my-[0px]"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute bottom-4 left-5 font-mono text-[12px] text-zinc-400 tracking-tight">
            display-banner-v1.jpg · 2.1 MB
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="w-[40%] flex flex-col py-6 px-8 gap-5 shrink-0 overflow-hidden">

          {/* Header — centered, no icon */}
          <div className="flex flex-col items-center shrink-0">
            <h2 className="text-lg font-semibold text-white tracking-tight text-center">
              Analyzing your display ad
            </h2>
            <p className="text-[13px] text-zinc-500 text-center mt-1">
              {subtitles[Math.min(currentStep, subtitles.length - 1)]}
            </p>
          </div>

          <div className="h-px w-full bg-white/[0.06] shrink-0 my-2" />

          {/* Dimension Progress Bars */}
          <div className="flex flex-col gap-5 shrink-0 flex-1">
            {dimensions.map((name, i) => {
              const status = getDimensionState(i);
              return (
                <div key={name} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[14px] font-medium transition-colors duration-500 ${
                        status === "complete"
                          ? "text-zinc-400"
                          : status === "progress"
                          ? "text-white"
                          : "text-zinc-600"
                      }`}
                    >
                      {name}
                    </span>
                    <div
                      className={`transition-all duration-500 flex items-center ${
                        status === "complete" ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      }`}
                    >
                      <CheckCircle2 size={14} className="text-[#10b981]" />
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all ease-out ${
                        status === "complete"
                          ? "bg-[#6366f1] duration-[600ms] w-full"
                          : status === "progress"
                          ? "bg-[#6366f1] duration-[2000ms] w-[65%]"
                          : "bg-[#6366f1] duration-0 w-0"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-auto flex flex-col items-center gap-3">
            <p className="text-[13px] text-zinc-500">
              This usually takes 20–30 seconds
            </p>
            <button className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-white transition-colors cursor-pointer">
              <X size={11} />
              <span>Cancel analysis</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}