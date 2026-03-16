/**
 * Cutsheet Product Demo
 * ─────────────────────
 * Canvas:   1200 × 750 @ 30fps
 * Duration: 1110 frames / 37.0s
 * Scenes:   8 (hard cuts, per-scene fade envelope)
 *
 * Timeline (zero overlap):
 * ┌──────────────┬───────┬────────┬─────────┐
 * │ Scene        │ From  │ Frames │ Seconds │
 * ├──────────────┼───────┼────────┼─────────┤
 * │ Intro        │     0 │    150 │    5.0s │
 * │ Dropzone     │   150 │    150 │    5.0s │
 * │ Analyzing    │   300 │    120 │    4.0s │
 * │ Scorecard    │   420 │    150 │    5.0s │
 * │ Improvements │   570 │    120 │    4.0s │
 * │ CTA Rewrite  │   690 │    120 │    4.0s │
 * │ Budget       │   810 │    150 │    5.0s │
 * │ Pre-Flight   │   960 │    150 │    5.0s │
 * └──────────────┴───────┴────────┴─────────┘
 * Last scene ends at 960 + 150 = 1110
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
export const DEMO_DURATION_FRAMES = 1110;
export const DEMO_WIDTH = 1200;
export const DEMO_HEIGHT = 750;

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
      <Sequence from={150} durationInFrames={150} name="Dropzone">
        <DropzoneScene />
      </Sequence>
      {/* Analyzing — 120f / 4.0s */}
      <Sequence from={300} durationInFrames={120} name="Analyzing">
        <AnalyzingScene />
      </Sequence>
      {/* Scorecard — 150f / 5.0s */}
      <Sequence from={420} durationInFrames={150} name="Scorecard">
        <ScorecardScene />
      </Sequence>
      {/* Improvements — 120f / 4.0s */}
      <Sequence from={570} durationInFrames={120} name="Improvements">
        <ImprovementsScene />
      </Sequence>
      {/* CTA Rewrite — 120f / 4.0s */}
      <Sequence from={690} durationInFrames={120} name="CTA Rewrite">
        <CTARewriteScene />
      </Sequence>
      {/* Budget — 150f / 5.0s */}
      <Sequence from={810} durationInFrames={150} name="Budget">
        <BudgetScene />
      </Sequence>
      {/* Pre-Flight — 150f / 5.0s */}
      <Sequence from={960} durationInFrames={150} name="Pre-Flight">
        <PreFlightScene />
      </Sequence>
    </AbsoluteFill>
  );
}
