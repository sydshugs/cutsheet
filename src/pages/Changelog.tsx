import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import CutsheetNav from '../components/ui/cutsheet-nav'
import CutsheetFooter from '../components/ui/cutsheet-footer'

type TagType = 'Feature' | 'Fix' | 'Improvement' | 'Coming Soon'

interface ChangelogEntry {
  date: string
  title: string
  description: string
  tags: TagType[]
}

const TAG_STYLES: Record<TagType, { bg: string; color: string }> = {
  Feature: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  Fix: { bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
  Improvement: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
  'Coming Soon': { bg: 'rgba(113,113,122,0.1)', color: '#a1a1aa' },
}

// Newest first — Q2 2026 upcoming, then Q1 2026 shipped
const ENTRIES: ChangelogEntry[] = [
  // Q2 2026 — Coming Soon
  {
    date: 'Q2 2026',
    title: 'AI Auto-Tagging at Upload',
    description: 'Every uploaded creative gets automatically categorized across hook tactic, visual format, messaging angle, and more — before the analysis even starts.',
    tags: ['Coming Soon'],
  },
  {
    date: 'Q2 2026',
    title: 'Historical Pattern Insights',
    description: 'Cutsheet learns from your past analyses. See which hook styles, CTA formats, and visual approaches score highest for your niche and platform.',
    tags: ['Coming Soon'],
  },
  {
    date: 'Q2 2026',
    title: 'Saved Competitor Library',
    description: 'Bookmark competitor creatives from Deconstructor into a persistent library. See aggregate patterns across their top-performing ads.',
    tags: ['Coming Soon'],
  },
  {
    date: 'Q2 2026',
    title: 'Weekly Score Digest',
    description: 'A weekly email with your scoring trends, weakest dimensions, and a generated brief to fix your most common issues.',
    tags: ['Coming Soon'],
  },
  // Q1 2026 — Shipped
  {
    date: 'Q1 2026',
    title: 'Brand Voice & Identity',
    description: 'Set your brand voice, upload a logo, and select voice tags during onboarding. Every AI output — rewrites, briefs, scripts — now matches your brand.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: '11-Dimension ScoreCard',
    description: 'Full creative scoring across 11 dimensions with confidence bands, score deltas from re-analysis, and platform-specific benchmarks for Meta, TikTok, YouTube, and Google Display.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'AI Rewrite',
    description: 'One-click rewrite of your hook, body, and CTA. Scored predictions show the expected improvement before you commit to changes.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Competitor Analysis',
    description: 'Upload your ad alongside a competitor. Cutsheet scores both, identifies the gap, and builds a prioritized action plan to close it.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Rank Creatives',
    description: 'Upload 5-10 variations. Get a ranked leaderboard with scores, so you know which 2-3 are worth putting spend behind.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'A/B Test — Compare Before Spending',
    description: 'Test two ad variants side by side. Get a scored comparison and recommendation without running a live test.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Display Analyzer with In-Situ Mockups',
    description: 'Score Google Display ads with format detection. See your creative rendered inside realistic GDN placements — 300x250, 728x90, 160x600, 300x600, and 320x50.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Safe Zone Check',
    description: 'Visual overlay showing platform-safe areas for TikTok, IG Reels, IG Stories, YT Shorts, and FB Reels. Automatically shown for video and 1080x1920 static ads.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Policy Check',
    description: 'Scan your creative against Meta, TikTok, YouTube, and Google ad policies before you submit. Category-level compliance with fix recommendations.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Creative Brief Generator',
    description: 'Reverse-engineer a production-ready brief from any high-scoring ad. Hook direction, key message, CTA, and platform-specific guidance.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Visualize — AI Art Director',
    description: 'See what your improved ad could look like. AI-generated visual concepts based on your scorecard recommendations.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Organic Content Scoring',
    description: 'Score organic posts for TikTok, Instagram, and YouTube. Platform-specific dimensions, hashtag suggestions, and hook analysis.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Supabase Auth + Stripe Billing',
    description: 'Full authentication with email/password and Google OAuth. Pro plan billing via Stripe with usage tracking.',
    tags: ['Feature'],
  },
  {
    date: 'Q1 2026',
    title: 'Design System Overhaul',
    description: 'Complete UI redesign — dark mode, Geist font, locked color system, Figma Make-aligned components across every screen.',
    tags: ['Improvement'],
  },
  {
    date: 'Q1 2026',
    title: 'Video Preview in Loading & Results',
    description: 'Uploaded videos now show a visible preview frame during analysis and in results, with black-frame detection and automatic seek retry.',
    tags: ['Fix'],
  },
]

export default function Changelog() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#f4f4f5' }}>
      <CutsheetNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px 80px' }}>
        {/* Back link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#71717a',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 40,
          }}
        >
          <ChevronLeft size={14} />
          Back
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#f4f4f5', marginBottom: 8, marginTop: 0 }}>
          Changelog
        </h1>
        <p style={{ fontSize: 15, color: '#71717a', marginBottom: 0, marginTop: 0 }}>
          What's new in Cutsheet
        </p>

        {/* Timeline */}
        <div style={{ marginTop: 48, position: 'relative' }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 7,
              top: 8,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          {ENTRIES.map((entry, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 24, marginBottom: 48, position: 'relative' }}
            >
              {/* Dot */}
              <div
                style={{
                  flexShrink: 0,
                  width: 15,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: entry.tags.includes('Coming Soon') ? '#52525c' : '#6366f1',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                {/* Date pill */}
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    color: '#818cf8',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 9999,
                    padding: '2px 10px',
                    marginBottom: 10,
                  }}
                >
                  {entry.date}
                </span>

                {/* Title */}
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f4f4f5', margin: '0 0 8px 0' }}>
                  {entry.title}
                </h2>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                  {entry.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        borderRadius: 9999,
                        padding: '2px 8px',
                        background: TAG_STYLES[tag].bg,
                        color: TAG_STYLES[tag].color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CutsheetFooter />
    </div>
  )
}
