import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { 
  Megaphone, 
  Smartphone, 
  Monitor, 
  BarChart2,
  ShoppingBag,
  Layers,
  Video,
  Users,
  Package,
  Camera,
  Music2,
  Search,
  Globe,
  ImagePlus,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

export type OnboardingData = {
  intent: string;
  niche: string;
  otherNiche: string;
  platform: string;
  brandName: string;
  brandVoiceDesc: string;
  brandVoiceTags: string[];
};

const INITIAL_DATA: OnboardingData = {
  intent: '',
  niche: '',
  otherNiche: '',
  platform: '',
  brandName: '',
  brandVoiceDesc: '',
  brandVoiceTags: [],
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const totalSteps = 5;

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleSkip = () => {
    nextStep();
  };

  const isCompleted = step === 6;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans overflow-hidden">
      {!isCompleted && (
        <header className="fixed top-0 w-full h-20 flex items-center justify-between px-6 z-50">
          <div className="w-24">
            <span className="font-bold text-xl tracking-tight text-white">cutsheet</span>
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isActive = step === i + 1;
              const isPast = step > i + 1;
              return (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-6 bg-indigo-500'
                      : isPast
                      ? 'w-2 bg-indigo-500'
                      : 'w-2 bg-[#27272a]'
                  }`}
                />
              );
            })}
          </div>

          <div className="w-24 flex justify-end">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 pt-20">
        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="w-full"
            >
              {step === 1 && <StepIntent data={data} update={updateData} onNext={nextStep} />}
              {step === 2 && <StepNiche data={data} update={updateData} onNext={nextStep} />}
              {step === 3 && <StepPlatform data={data} update={updateData} onNext={nextStep} />}
              {step === 4 && <StepBrandIdentity data={data} update={updateData} onNext={nextStep} onSkip={handleSkip} />}
              {step === 5 && <StepBrandVoice data={data} update={updateData} onNext={nextStep} onSkip={handleSkip} />}
              {step === 6 && <CompletionScreen data={data} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Steps Components ---

function StepIntent({ data, update, onNext }: any) {
  const options = [
    { id: 'paid', icon: Megaphone, title: 'Paid Ads', desc: 'Meta, TikTok, Google, YouTube' },
    { id: 'organic', icon: Smartphone, title: 'Organic Content', desc: 'TikToks, Reels, Shorts' },
    { id: 'display', icon: Monitor, title: 'Display Banners', desc: 'Google Display, affiliate' },
    { id: 'both', icon: BarChart2, title: 'Both', desc: 'I do a mix of everything' },
  ];

  return (
    <div className="flex flex-col">
      <h1 className="text-[28px] font-semibold text-zinc-100 leading-tight">What do you create?</h1>
      <p className="text-sm text-zinc-500 mt-2">We'll tailor everything to your workflow.</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {options.map((opt) => {
          const isSelected = data.intent === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => update({ intent: opt.id })}
              className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03]'
              }`}
            >
              <div className={`p-2 rounded-xl inline-flex mb-3 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-zinc-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{opt.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{opt.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center h-12">
        <AnimatePresence>
          {data.intent && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={onNext}
              className="rounded-full bg-[#6366f1] text-white text-sm font-semibold px-8 py-3 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              Continue &rarr;
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepNiche({ data, update, onNext }: any) {
  const options = [
    { id: 'ecom', icon: ShoppingBag, title: 'Ecommerce / DTC', desc: 'Physical products, online stores' },
    { id: 'saas', icon: Layers, title: 'SaaS / Software', desc: 'Apps, tools, digital products' },
    { id: 'creator', icon: Video, title: 'Creator / Content', desc: 'UGC, influencer, personal brand' },
    { id: 'agency', icon: Users, title: 'Agency', desc: 'Managing ads for clients' },
  ];

  return (
    <div className="flex flex-col pb-10">
      <h1 className="text-[28px] font-semibold text-zinc-100 leading-tight">What's your niche?</h1>
      <p className="text-sm text-zinc-500 mt-2">Hook windows and benchmarks vary by industry.</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {options.map((opt) => {
          const isSelected = data.niche === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => update({ niche: opt.id })}
              className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03]'
              }`}
            >
              <div className={`p-2 rounded-xl inline-flex mb-3 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-zinc-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{opt.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{opt.desc}</p>
            </div>
          );
        })}
        
        {/* Other Card */}
        <div
          onClick={() => update({ niche: 'other' })}
          className={`col-span-2 rounded-2xl border p-5 cursor-pointer transition-all ${
            data.niche === 'other'
              ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl inline-flex ${data.niche === 'other' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-zinc-400'}`}>
                <Package className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-sm font-semibold text-zinc-200">Other</h3>
             </div>
          </div>
          
          <AnimatePresence>
            {data.niche === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Tell us what you do..."
                  value={data.otherNiche}
                  onChange={(e) => update({ otherNiche: e.target.value })}
                  autoFocus
                  className="w-full rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 flex justify-center h-12">
        <AnimatePresence>
          {(data.niche && data.niche !== 'other') || (data.niche === 'other' && data.otherNiche.trim().length > 0) ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={onNext}
              className="rounded-full bg-[#6366f1] text-white text-sm font-semibold px-8 py-3 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              Continue &rarr;
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepPlatform({ data, update, onNext }: any) {
  const options = [
    { id: 'meta', icon: Camera, title: 'Meta', desc: 'Facebook + Instagram' },
    { id: 'tiktok', icon: Music2, title: 'TikTok', desc: 'TikTok Ads' },
    { id: 'google', icon: Search, title: 'Google', desc: 'Search + Display + YouTube' },
    { id: 'multi', icon: Globe, title: 'Multiple platforms', desc: 'I use a mix' },
  ];

  return (
    <div className="flex flex-col">
      <h1 className="text-[28px] font-semibold text-zinc-100 leading-tight">Where do you advertise?</h1>
      <p className="text-sm text-zinc-500 mt-2">We'll optimize suggestions for your primary platform.</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {options.map((opt) => {
          const isSelected = data.platform === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => update({ platform: opt.id })}
              className={`rounded-2xl border p-5 cursor-pointer transition-all flex flex-col items-center text-center ${
                isSelected
                  ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03]'
              }`}
            >
              <div className={`p-3 rounded-2xl mb-4 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-zinc-400'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{opt.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{opt.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center h-12">
        <AnimatePresence>
          {data.platform && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={onNext}
              className="rounded-full bg-[#6366f1] text-white text-sm font-semibold px-8 py-3 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              Continue &rarr;
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepBrandIdentity({ data, update, onNext, onSkip }: any) {
  return (
    <div className="flex flex-col">
      <h1 className="text-[28px] font-semibold text-zinc-100 leading-tight">Add your brand identity</h1>
      <p className="text-sm text-zinc-500 mt-2">Used in your in-situ mockups and AI rewrites. Always optional.</p>

      <div className="rounded-2xl border-2 border-dashed border-white/[0.10] bg-white/[0.02] p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-colors mt-6 group">
        <ImagePlus className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
        <div className="text-center">
          <p className="text-sm text-zinc-400 font-medium mb-1 group-hover:text-zinc-300">Upload your logo</p>
          <p className="text-xs text-zinc-600">PNG, SVG, WEBP · Square or circular · 500KB max</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Brand name (optional)"
        value={data.brandName}
        onChange={(e) => update({ brandName: e.target.value })}
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 mt-3 focus:outline-none focus:border-indigo-500/50 transition-colors w-full"
      />

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={onNext}
          className="rounded-full bg-[#6366f1] text-white text-sm font-semibold px-8 py-3 transition-colors"
        >
          Continue &rarr;
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function StepBrandVoice({ data, update, onNext, onSkip }: any) {
  const VOICE_TAGS = [
    'Playful', 'Bold', 'Authoritative', 'Witty', 'Warm', 
    'Direct', 'Edgy', 'Luxurious', 'Minimal', 'Conversational'
  ];

  const toggleTag = (tag: string) => {
    const current = data.brandVoiceTags;
    if (current.includes(tag)) {
      update({ brandVoiceTags: current.filter((t: string) => t !== tag) });
    } else if (current.length < 4) {
      update({ brandVoiceTags: [...current, tag] });
    }
  };

  const remainingChars = 300 - (data.brandVoiceDesc?.length || 0);

  return (
    <div className="flex flex-col">
      <h1 className="text-[28px] font-semibold text-zinc-100 leading-tight">What's your brand voice?</h1>
      <p className="text-sm text-zinc-500 mt-2">AI rewrites and copy suggestions will match your tone.</p>

      <div className="relative mt-6">
        <textarea
          placeholder="Describe your brand voice — e.g. 'Direct and confident, like a knowledgeable friend. Never corporate. Always specific.'"
          value={data.brandVoiceDesc}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              update({ brandVoiceDesc: e.target.value });
            }
          }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 w-full h-[120px] resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-600">
          {remainingChars}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 mb-2">
          SELECT UP TO 4
        </p>
        <div className="flex flex-wrap gap-2">
          {VOICE_TAGS.map((tag) => {
            const isSelected = data.brandVoiceTags.includes(tag);
            const isDisabled = !isSelected && data.brandVoiceTags.length >= 4;
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isDisabled}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isSelected
                    ? 'border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={onNext}
          className="w-full rounded-full bg-[#6366f1] text-white text-sm font-semibold px-8 py-3 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          Finish Setup &rarr;
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function CompletionScreen({ data }: any) {
  const navigate = useNavigate();
  const getPills = () => {
    const pills = [];
    if (data.niche) pills.push(data.niche === 'other' ? data.otherNiche : data.niche);
    if (data.platform) pills.push(data.platform);
    if (data.brandVoiceTags.length > 0) {
      pills.push(...data.brandVoiceTags);
    } else if (data.intent) {
      pills.push(data.intent);
    }
    return pills.slice(0, 4); // Show up to 4 pills
  };

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1, damping: 20 }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" />
          <CheckCircle2 className="w-10 h-10 text-indigo-500" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[32px] font-bold text-zinc-100 leading-tight"
      >
        You're all set.
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-base text-zinc-500 mt-2 max-w-[280px]"
      >
        Cutsheet is ready for your first creative.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 mt-6 max-w-[300px]"
      >
        {getPills().map((pill: string, i: number) => (
          <div
            key={i}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] text-zinc-400 capitalize"
          >
            {pill}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <button
          onClick={() => navigate('/app/paid-ad')}
          className="rounded-full bg-[#6366f1] text-white text-[15px] font-semibold px-10 py-4 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 transform duration-200"
        >
          Start Analyzing &rarr;
        </button>
      </motion.div>
    </div>
  );
}