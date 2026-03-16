import { Player } from '@remotion/player';
import {
  CutsheetDemoComposition,
  DEMO_FPS,
  DEMO_DURATION_FRAMES,
  DEMO_WIDTH,
  DEMO_HEIGHT,
} from './CutsheetDemo';

export default function RemotionDemoPlayer() {
  return (
    <Player
      component={CutsheetDemoComposition}
      durationInFrames={DEMO_DURATION_FRAMES}
      compositionWidth={DEMO_WIDTH}
      compositionHeight={DEMO_HEIGHT}
      fps={DEMO_FPS}
      controls
      loop
      style={{
        width: '100%',
        maxWidth: 960,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
