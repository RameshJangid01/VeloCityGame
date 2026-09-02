interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
}

/**
 * Custom VELOCITY emblem: a speed-chevron badge built from scratch in SVG
 * (not a stock icon) paired with an Outfit wordmark. The chevrons form a
 * "V" while doubling as motion/speed lines, and the ring gives it a
 * racing medallion feel.
 */
export function Logo({ size = 36, variant = 'dark', showWordmark = true }: LogoProps) {
  const textColor = variant === 'dark' ? '#F3F5F9' : '#101828';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="velocityRing" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E0C6" />
            <stop offset="100%" stopColor="#FF3D8A" />
          </linearGradient>
          <linearGradient id="velocityChevron" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F5D4" />
            <stop offset="100%" stopColor="#00A895" />
          </linearGradient>
        </defs>

        <circle cx="24" cy="24" r="22.5" stroke="url(#velocityRing)" strokeWidth="2" fill="none" />
        <circle cx="24" cy="24" r="22.5" fill="url(#velocityRing)" fillOpacity="0.06" />

        {/* Speed-chevron "V" mark */}
        <path d="M9 13 L22 30 L22 38 L9 21 Z" fill="url(#velocityChevron)" />
        <path d="M39 13 L26 30 L26 38 L39 21 Z" fill="url(#velocityChevron)" fillOpacity="0.55" />

        {/* Motion tick */}
        <rect x="6" y="24.5" width="9" height="2.4" rx="1.2" fill="#FFB800" />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.5,
            letterSpacing: '0.06em',
            color: textColor,
            lineHeight: 1,
          }}
        >
          VELOCITY
        </span>
      )}
    </div>
  );
}
