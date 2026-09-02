import { motion } from 'framer-motion';
import { TrophyFilled } from '@ant-design/icons';
import type { RaceBikeDto, RaceStatus } from '../types';

interface Props {
  bike: RaceBikeDto;
  elapsedSeconds: number;
  durationSeconds: number;
  status: RaceStatus;
  isWinner: boolean;
  raceFinished: boolean;
}

export function BikeLane({ bike, elapsedSeconds, durationSeconds, status, isWinner, raceFinished }: Props) {
  const rawProgress = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 0;
  // Each bike gets a slightly different visual pace via its server-assigned
  // speedFactor, plus a light wobble so lanes don't move in perfect lockstep.
  // This is purely cosmetic - the authoritative winner always comes from the
  // server's RaceFinished event, never from which lane looks "ahead" visually.
  const wobble = Math.sin((elapsedSeconds + bike.displayOrder * 1.7) * 2.1) * 0.015;
  let progress = Math.min(1, Math.max(0, rawProgress * bike.speedFactor + wobble));
  if (raceFinished) progress = isWinner ? 1 : Math.min(progress, 0.97);
  if (status === 'SCHEDULED') progress = 0;

  const dimmed = raceFinished && !isWinner;

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: 48, transition: 'opacity 0.5s', opacity: dimmed ? 0.4 : 1,
    }}>
      <div className="lane-dash" style={{ position: 'absolute', inset: 0, opacity: 0.3, borderRadius: 8 }} />
      <div style={{ width: 40, flexShrink: 0, textAlign: 'center', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 13, zIndex: 1 }}>
        {String(bike.bikeNumber).padStart(2, '0')}
      </div>
      <div style={{ position: 'relative', flex: 1, height: '100%', margin: '0 4px' }}>
        <motion.div
          style={{ position: 'absolute', top: '50%', translateY: '-50%', display: 'flex', alignItems: 'center', gap: 4 }}
          animate={{ left: `calc(${progress * 92}%)` }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
        >
          {status === 'RUNNING' && !raceFinished && (
            <span style={{ position: 'absolute', right: '100%', marginRight: 4, display: 'flex', gap: 2 }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="animate-dust" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          )}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%',
              fontWeight: 800, fontSize: 12, fontFamily: "'Outfit', sans-serif",
              boxShadow: isWinner && raceFinished ? '0 0 16px rgba(255,184,0,0.55)' : '0 2px 8px rgba(0,0,0,0.3)',
              background: isWinner && raceFinished
                ? 'linear-gradient(135deg, #FFD666, #FFB800)'
                : 'linear-gradient(135deg, #232B41, #161D2E)',
              color: isWinner && raceFinished ? '#101828' : '#00E0C6',
              border: isWinner && raceFinished ? 'none' : '1px solid rgba(255,255,255,0.1)',
              transform: isWinner && raceFinished ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.3s',
            }}
          >
            {isWinner && raceFinished ? <TrophyFilled /> : bike.bikeNumber}
          </div>
        </motion.div>
      </div>
      <div style={{ width: 110, flexShrink: 0, paddingLeft: 8, zIndex: 1, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {bike.name}
      </div>
    </div>
  );
}
