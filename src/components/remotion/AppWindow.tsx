import type { CSSProperties, ReactNode } from 'react';
import { TOKENS } from './tokens';

interface AppWindowProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}

const TRAFFIC_LIGHTS = [
  { color: '#FF5F57' },
  { color: '#FFBD2E' },
  { color: '#27C93F' },
];

export function AppWindow({ title = 'cutsheet.xyz', children, style }: AppWindowProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '85%',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: TOKENS.radiusLg,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 36,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}
      >
        {/* Traffic light dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {TRAFFIC_LIGHTS.map((dot) => (
            <div
              key={dot.color}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: dot.color,
              }}
            />
          ))}
        </div>

        {/* Centered title */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontFamily: TOKENS.fontMono,
            color: TOKENS.inkFaint,
          }}
        >
          {title}
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          background: TOKENS.bg,
        }}
      >
        {children}
      </div>
    </div>
  );
}
