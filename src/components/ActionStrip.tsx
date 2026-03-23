import { Loader2, Wand2, FileText, ShieldCheck, Share2, Sparkles, Lock } from 'lucide-react';
import { getVerdict } from '../lib/scoreColors';

interface ActionStripProps {
  overallScore: number;
  onFixIt?: () => void;
  onGenerateBrief?: () => void;
  onCheckPolicies?: () => void;
  onShare?: () => void;
  onVisualize?: () => void;
  fixItLoading?: boolean;
  briefLoading?: boolean;
  policyLoading?: boolean;
  visualizeLoading?: boolean;
  canVisualize?: boolean;
  isPro?: boolean;
  onUpgradeRequired?: (feature: string) => void;
}

function ActionButton({
  label, icon: Icon, onClick, loading, primary, loadingText,
}: {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  loading?: boolean;
  primary?: boolean;
  disabled?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={primary ? 'cs-btn-primary h-9 px-4' : 'cs-btn-ghost h-9 px-3'}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingText || label}
        </>
      ) : (
        <>
          <Icon size={14} />
          {label}
        </>
      )}
    </button>
  );
}

export function ActionStrip({
  overallScore, onFixIt, onGenerateBrief, onCheckPolicies, onShare,
  onVisualize, fixItLoading, briefLoading, policyLoading, visualizeLoading,
  canVisualize, isPro, onUpgradeRequired,
}: ActionStripProps) {
  const verdict = getVerdict(overallScore);
  const fixLabel = overallScore >= 8 ? 'Polish This Ad' : 'Fix This Ad';
  const primaryAction = verdict === 'Kill' ? 'fix' : verdict === 'Test' ? 'brief' : 'share';

  return (
    <div className="flex flex-wrap gap-2">
      {onFixIt && (
        <ActionButton label={fixLabel} icon={Wand2} onClick={onFixIt}
          loading={fixItLoading} loadingText="Rewriting your ad..." primary={primaryAction === 'fix'} />
      )}
      {onGenerateBrief && (
        <ActionButton label="Brief" icon={FileText} onClick={onGenerateBrief}
          loading={briefLoading} loadingText="Writing brief..." primary={primaryAction === 'brief'} />
      )}
      {onCheckPolicies && (
        <ActionButton label="Ad Policies" icon={ShieldCheck} onClick={onCheckPolicies}
          loading={policyLoading} loadingText="Checking policies..." />
      )}
      {canVisualize !== false && onVisualize && (
        isPro ? (
          <ActionButton label="See Improved" icon={Sparkles} onClick={onVisualize} loading={visualizeLoading} />
        ) : (
          <button type="button" onClick={() => onUpgradeRequired?.('visualize')}
            className="cs-btn-ghost h-9 px-3 opacity-50">
            <Lock size={12} />
            See Improved
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>PRO</span>
          </button>
        )
      )}
      {onShare && (
        <ActionButton label="Share Score" icon={Share2} onClick={onShare} primary={primaryAction === 'share'} />
      )}
    </div>
  );
}
