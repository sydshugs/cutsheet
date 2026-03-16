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
export const DEMO_WIDTH = 1280;
export const DEMO_HEIGHT = 720;

export function CutsheetDemoComposition() {
  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
    }}>
      <Sequence from={0} durationInFrames={150} name="Intro">
        <IntroScene />
      </Sequence>
      <Sequence from={150} durationInFrames={150} name="Dropzone">
        <DropzoneScene />
      </Sequence>
      <Sequence from={300} durationInFrames={120} name="Analyzing">
        <AnalyzingScene />
      </Sequence>
      <Sequence from={420} durationInFrames={150} name="Scorecard">
        <ScorecardScene />
      </Sequence>
      <Sequence from={570} durationInFrames={120} name="Improvements">
        <ImprovementsScene />
      </Sequence>
      <Sequence from={690} durationInFrames={120} name="CTA Rewrite">
        <CTARewriteScene />
      </Sequence>
      <Sequence from={810} durationInFrames={150} name="Budget">
        <BudgetScene />
      </Sequence>
      <Sequence from={960} durationInFrames={150} name="Pre-Flight">
        <PreFlightScene />
      </Sequence>
    </AbsoluteFill>
  );
}
