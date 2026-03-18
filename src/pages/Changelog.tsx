import { Link } from 'react-router-dom'

type TagType = 'Feature' | 'Fix' | 'Improvement'

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
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: 'Mar 2026',
    title: 'Intent-Based Navigation',
    description: 'Complete app restructure. Analyze paid ads separately from organic content. New sidebar: ANALYZE / COMPARE / LIBRARY. Platform selector for Meta, TikTok, Google, YouTube. Organic content scoring with Second Eye fresh-viewer review.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Supabase Auth',
    description: 'Full authentication system. Sign up, sign in, email confirmation, password reset. Onboarding flow with niche, platform, and role.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Stripe Billing',
    description: 'Pro plan at $29/month. Free tier: 3 analyses/month. Usage tracking in sidebar. Upgrade modal, checkout, Stripe Customer Portal.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Settings Pages',
    description: 'Profile, Billing, and Usage tabs. Email and password management. Plan status and invoice access via Stripe.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Claude Sonnet Integration',
    description: 'Improvement suggestions and CTA rewrites now powered by Claude Sonnet in addition to Gemini 2.5 Flash for video analysis.',
    tags: ['Improvement'],
  },
  {
    date: 'Mar 2026',
    title: 'Static Ad Support',
    description: 'Cutsheet now analyzes static image ads (JPG, PNG, WEBP) in addition to video creatives.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Pre-Flight A/B Testing',
    description: 'Test two ad variants before spending. Get a scored comparison and recommendation without running a live test.',
    tags: ['Feature'],
  },
  {
    date: 'Mar 2026',
    title: 'Launch',
    description: 'Cutsheet is live at cutsheet.xyz. Upload any video or static ad creative. Get a full AI breakdown in 30 seconds.',
    tags: ['Feature'],
  },
]

export default function Changelog() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#71717a', fontSize: 13, textDecoration: 'none', marginBottom: 40 }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#f4f4f5', marginBottom: 8, marginTop: 0 }}>Changelog</h1>
        <p style={{ fontSize: 15, color: '#71717a', marginBottom: 8, marginTop: 0 }}>What's new in Cutsheet</p>
        <a href="https://twitter.com/getcutsheet" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}>@getcutsheet</a>

        {/* Timeline */}
        <div style={{ marginTop: 48, position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />

          {ENTRIES.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 48, position: 'relative' }}>
              {/* Dot */}
              <div style={{ flexShrink: 0, width: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 0 }}>
                {/* Date pill */}
                <span style={{
                  display: 'inline-block', fontSize: 11, color: '#818cf8',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 9999, padding: '2px 10px', marginBottom: 10,
                }}>
                  {entry.date}
                </span>

                {/* Title */}
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f4f4f5', margin: '0 0 8px 0' }}>{entry.title}</h2>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 12px 0' }}>{entry.description}</p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, borderRadius: 9999, padding: '2px 8px',
                      background: TAG_STYLES[tag].bg, color: TAG_STYLES[tag].color,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
