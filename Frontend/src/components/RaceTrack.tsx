import { Typography } from 'antd';
import type { PublicRaceStateDto } from '../types';
import { BikeLane } from './BikeLane';

const { Text } = Typography;

export function RaceTrack({ race }: { race: PublicRaceStateDto }) {
  const finished = race.status === 'FINISHED';

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div className="track-asphalt" style={{ padding: '16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
          <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            ● Start
          </Text>
          <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            Finish
          </Text>
        </div>

        <div>
          {race.bikes.map((bike) => (
            <BikeLane
              key={bike.bikeId}
              bike={bike}
              elapsedSeconds={race.elapsedSeconds}
              durationSeconds={race.durationSeconds}
              status={race.status}
              isWinner={finished && race.winnerBikeId === bike.bikeId}
              raceFinished={finished}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
