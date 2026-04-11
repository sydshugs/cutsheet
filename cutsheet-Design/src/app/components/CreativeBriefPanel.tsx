import React, { useState } from "react";
import { 
  ChevronLeft, 
  Sparkles, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  Target,
  Users,
  Zap,
  LayoutTemplate,
  MessageSquareText,
  MousePointerClick,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Shield
} from "lucide-react";

interface CreativeBriefPanelProps {
  onClose: () => void;
}

type Category = 'All' | 'Strategy' | 'Creative' | 'Execution';

interface Section {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  icon: any;
  colorType: 'indigo' | 'amber' | 'emerald';
  content?: string;
  listType?: 'hook' | 'proof' | 'do' | 'dont';
  listItems?: string[];
}

const sections: Section[] = [
  {
    id: 'objective',
    name: 'Objective',
    category: 'Strategy',
    icon: Target,
    colorType: 'indigo',
    content: 'Drive direct conversions and app installs by highlighting the core value proposition of AI-powered design generation in under 30 seconds.'
  },
  {
    id: 'audience',
    name: 'Target Audience',
    category: 'Strategy',
    icon: Users,
    colorType: 'indigo',
    content: 'Performance marketers, growth leads, and creative strategists seeking to reduce cost-per-acquisition through rapid creative testing.'
  },
  {
    id: 'hook',
    name: 'Hook',
    category: 'Creative',
    icon: Zap,
    colorType: 'amber',
    listType: 'hook',
    listItems: [
      '"Stop guessing what works." (Text overlay + quick visual glitch)',
      'Visual of a lagging/failing ad dashboard turning green.',
      '"What if your next ad could design itself?"'
    ]
  },
  {
    id: 'format',
    name: 'Format',
    category: 'Creative',
    icon: LayoutTemplate,
    colorType: 'amber',
    content: 'Static image with bold, high-contrast typography and a distinct UI mockup element to establish software credibility.'
  },
  {
    id: 'key-message',
    name: 'Key Message',
    category: 'Creative',
    icon: MessageSquareText,
    colorType: 'amber',
    content: 'Our AI analyzes and generates top-performing creative variations instantly, letting you focus on strategy rather than pixel-pushing.'
  },
  {
    id: 'cta',
    name: 'CTA',
    category: 'Creative',
    icon: MousePointerClick,
    colorType: 'amber',
    content: 'Start Free Trial / Generate Your First Ad'
  },
  {
    id: 'proof-points',
    name: 'Proof Points',
    category: 'Execution',
    icon: ShieldCheck,
    colorType: 'emerald',
    listType: 'proof',
    listItems: [
      'Over $50M in ad spend optimized',
      'Trusted by 500+ D2C brands',
      'Average 40% reduction in CPA'
    ]
  },
  {
    id: 'do',
    name: 'Do',
    category: 'Execution',
    icon: CheckCircle2,
    colorType: 'emerald',
    listType: 'do',
    listItems: [
      'Keep text safe zones clear for platform UI elements',
      'Use high-contrast branding colors',
      'Show the actual product interface clearly'
    ]
  },
  {
    id: 'dont',
    name: 'Don\'t',
    category: 'Execution',
    icon: XCircle,
    colorType: 'emerald',
    listType: 'dont',
    listItems: [
      'Overcrowd the frame with multiple competing messages',
      'Use generic stock photography without UI integration',
      'Forget to include the company logo in the first 3 seconds'
    ]
  }
];

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/[0.10]',
    text: 'text-[#6366f1]', // indigo-500 usually
  },
  amber: {
    bg: 'bg-amber-500/[0.10]',
    text: 'text-[#f59e0b]',
  },
  emerald: {
    bg: 'bg-emerald-500/[0.10]',
    text: 'text-[#10b981]',
  }
};

export function CreativeBriefPanel({ onClose }: CreativeBriefPanelProps) {
  const [activeFilter, setActiveFilter] = useState<Category>('All');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // All expanded by default for better visibility
    const initial: Record<string, boolean> = {};
    sections.forEach(s => initial[s.id] = true);
    return initial;
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = activeFilter === 'All' 
    ? sections 
    : sections.filter(s => s.category === activeFilter);

  const filters: { label: Category; count: number }[] = [
    { label: 'All', count: 9 },
    { label: 'Strategy', count: 2 },
    { label: 'Creative', count: 4 },
    { label: 'Execution', count: 3 }
  ];

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* Back Link */}
      <button 
        onClick={onClose}
        className="flex items-center gap-1.5 mb-4 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors w-fit group"
      >
        <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-medium">Back to Scores</span>
      </button>

      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.12] flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-[#6366f1]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-zinc-100 leading-tight">Creative Brief</h2>
            <span className="text-xs text-zinc-500 mt-0.5">AI-generated strategy & direction</span>
          </div>
        </div>
        <div className="rounded-full border border-white/[0.06] bg-white/[0.02] text-[10px] text-zinc-500 px-2.5 py-1">
          Meta · Static
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center gap-2 mt-3 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(filter => {
          const isActive = activeFilter === filter.label;
          return (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              className={`flex items-center whitespace-nowrap text-xs rounded-full px-2.5 py-1 transition-colors ${
                isActive 
                  ? 'border border-white/[0.12] bg-white/[0.04] text-zinc-200' 
                  : 'border border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              {filter.label}
              <span className={`text-[10px] rounded-full px-1.5 ml-1 flex items-center justify-center ${
                isActive ? 'bg-white/[0.08] text-zinc-300' : 'bg-white/[0.05] text-zinc-500'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* BODY - CARDS */}
      <div className="flex flex-col gap-3">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections[section.id];
          const Icon = section.icon;
          
          return (
            <div 
              key={section.id} 
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col group/card"
            >
              {/* Card Header */}
              <button 
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.id === 'dont' ? 'bg-red-500/[0.10]' : colorMap[section.colorType].bg}`}>
                    <Icon size={14} className={section.id === 'dont' ? 'text-[#ef4444]' : colorMap[section.colorType].text} />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm font-semibold text-zinc-100">{section.name}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${section.id === 'dont' ? 'text-[#ef4444]' : colorMap[section.colorType].text}`}>
                      {section.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 hover:bg-white/[0.06] rounded-md text-zinc-600 hover:text-zinc-300 cursor-pointer">
                    <Copy size={12} />
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-zinc-600" />
                  ) : (
                    <ChevronRight size={14} className="text-zinc-600" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.04]">
                  {section.content && (
                    <p className="text-sm text-zinc-300 leading-relaxed pt-3">
                      {section.content}
                    </p>
                  )}
                  
                  {section.listItems && (
                    <div className="flex flex-col gap-2 pt-3">
                      {section.listItems.map((item, idx) => (
                        <div 
                          key={idx}
                          className={`rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${
                            section.listType === 'do' ? 'bg-emerald-500/[0.04] border-emerald-500/[0.1] text-zinc-200' :
                            section.listType === 'dont' ? 'bg-red-500/[0.04] border-red-500/[0.1] text-zinc-200' :
                            'bg-white/[0.02] border-white/[0.04] text-zinc-300'
                          }`}
                        >
                          {section.listType === 'hook' && (
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                          )}
                          {section.listType === 'proof' && (
                            <Shield size={14} className="text-emerald-500 shrink-0 mt-1" />
                          )}
                          {section.listType === 'do' && (
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-1" />
                          )}
                          {section.listType === 'dont' && (
                            <XCircle size={14} className="text-[#ef4444] shrink-0 mt-1" />
                          )}
                          <span className="text-sm leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-6 border-t border-white/[0.06] pt-5 pb-4">
        <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 py-3 transition-colors">
          <Copy size={14} className="text-white" />
          <span className="text-sm font-semibold text-white">Copy Full Brief</span>
        </button>
      </div>

    </div>
  );
}