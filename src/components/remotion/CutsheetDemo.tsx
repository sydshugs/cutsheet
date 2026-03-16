/**
 * Cutsheet Product Demo
 * ─────────────────────
 * Canvas:   1280 × 720 @ 30fps
 * Duration: 956 frames / 31.9s
 * Scenes:   8 (22-frame crossfade overlap between each)
 *
 * Timeline (post-overlap):
 * ┌──────────────┬───────┬────────┬─────────┐
 * │ Scene        │ From  │ Frames │ Seconds │
 * ├──────────────┼───────┼────────┼─────────┤
 * │ Intro        │     0 │    150 │    5.0s │
 * │ Dropzone     │   128 │    150 │    5.0s │
 * │ Analyzing    │   256 │    120 │    4.0s │
 * │ Scorecard    │   354 │    150 │    5.0s │
 * │ Improvements │   482 │    120 │    4.0s │
 * │ CTA Rewrite  │   580 │    120 │    4.0s │
 * │ Budget       │   678 │    150 │    5.0s │
 * │ Pre-Flight   │   806 │    150 │    5.0s │
 * └──────────────┴───────┴────────┴─────────┘
 * Last scene ends at 806 + 150 = 956
 */

import { AbsoluteFill, Sequence } from 'remotion';
import { TOKENS } from './tokens';
import { IntroScene } from './scenes/IntroScene';
import { DropzoneScene } from './scenes/DropzoneScene';
import { AnalyzingScene } from './scenes/AnalyzingScene';
import { ScorecardScene } from './scenes/ScorecardScene';
import { ImprovementsScene } from './scenes/ImprovementsScene';
import { CTARewriteScene } from './scenes/CTARewriteScene';
import { BudgetScene } from './scenes/BudgetScene';
import { PreFlightScene } from './scenes/PreFlightScene';

export const DEMO_FPS = 30;
export const DEMO_DURATION_FRAMES = 956;
export const DEMO_WIDTH = 1280;
export const DEMO_HEIGHT = 720;

export function CutsheetDemoComposition() {
  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
    }}>
      {/* Intro — 150f / 5.0s */}
      <Sequence from={0} durationInFrames={150} name="Intro">
        <IntroScene />
      </Sequence>
      {/* Dropzone — 150f / 5.0s */}
      <Sequence from={128} durationInFrames={150} name="Dropzone">
        <DropzoneScene />
      </Sequence>
      {/* Analyzing — 120f / 4.0s */}
      <Sequence from={256} durationInFrames={120} name="Analyzing">
        <AnalyzingScene />
      </Sequence>
      {/* Scorecard — 150f / 5.0s */}
      <Sequence from={354} durationInFrames={150} name="Scorecard">
        <ScorecardScene />
      </Sequence>
      {/* Improvements — 120f / 4.0s */}
      <Sequence from={482} durationInFrames={120} name="Improvements">
        <ImprovementsScene />
      </Sequence>
      {/* CTA Rewrite — 120f / 4.0s */}
      <Sequence from={580} durationInFrames={120} name="CTA Rewrite">
        <CTARewriteScene />
      </Sequence>
      {/* Budget — 150f / 5.0s */}
      <Sequence from={678} durationInFrames={150} name="Budget">
        <BudgetScene />
      </Sequence>
      {/* Pre-Flight — 150f / 5.0s */}
      <Sequence from={806} durationInFrames={150} name="Pre-Flight">
        <PreFlightScene />
      </Sequence>
    </AbsoluteFill>
  );
}
