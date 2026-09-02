import { useEffect, useState } from 'react';
import { Layout, Typography, Card, Space, Tag, Row, Col, Grid } from 'antd';
import { UserOutlined, FlagFilled } from '@ant-design/icons';
import { useRaceConnection } from '../hooks/useRaceConnection';
import { RaceTrack } from '../components/RaceTrack';
import { CountdownTimer } from '../components/CountdownTimer';
import { WinnerModal } from '../components/WinnerModal';
import { PublicHeader } from '../components/PublicHeader';

const { Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export function RacePage() {
  const { race, status, viewerCount, getServerNow } = useRaceConnection();
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [lastFinishedId, setLastFinishedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Local re-render tick to smoothly advance countdowns/elapsed time
  // between server broadcasts. Actual state (status, winner) always
  // comes from the server - this only smooths the visual clock.
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (race?.status === 'FINISHED' && race.raceId !== lastFinishedId) {
      setShowWinnerModal(true);
      setLastFinishedId(race.raceId);
    }
  }, [race, lastFinishedId]);

  if (!race) {
    return (
      <Layout className="dusk-page">
        <PublicHeader status={status} viewerCount={viewerCount} isLive={false} />
        <Content style={{ maxWidth: 800, margin: '0 auto', width: '100%', padding: '96px 16px', textAlign: 'center' }}>
          <Text type="secondary">Loading race data...</Text>
        </Content>
      </Layout>
    );
  }

  const now = getServerNow();
  const startTime = new Date(race.startTimeUtc);
  const secondsToStart = Math.max(0, (startTime.getTime() - now.getTime()) / 1000);
  const liveElapsed = race.status === 'RUNNING'
    ? Math.min(race.durationSeconds, (now.getTime() - startTime.getTime()) / 1000)
    : race.elapsedSeconds;
  const liveRemaining = Math.max(0, race.durationSeconds - liveElapsed);

  void tick; // trigger re-render each interval

  return (
    <Layout className="dusk-page">
      <PublicHeader status={status} viewerCount={viewerCount} isLive={race.status === 'RUNNING'} />

      <Content style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: isMobile ? '20px 12px 48px' : '32px 24px 64px' }}>
        {/* Header strip */}
        <Card className="glass-card" styles={{ body: { padding: 16 } }} style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" gutter={[12, 12]}>
            <Col>
              <Space size={10} wrap>
                {race.status === 'RUNNING' && (
                  <Tag color="error" style={{ borderRadius: 20, fontWeight: 700 }}>● LIVE</Tag>
                )}
                {race.status === 'SCHEDULED' && (
                  <Tag color="cyan" style={{ borderRadius: 20, fontWeight: 700 }}>NEXT RACE</Tag>
                )}
                {race.status === 'FINISHED' && (
                  <Tag color="gold" style={{ borderRadius: 20, fontWeight: 700 }}>FINISHED</Tag>
                )}
                <Text strong style={{ color: '#fff' }}>Race #{race.raceId.slice(-6)}</Text>
                <Text type="secondary">{race.bikes.length} Bikes • {race.durationSeconds}s</Text>
              </Space>
            </Col>
            <Col>
              <Space size={4} style={{ color: 'rgba(255,255,255,0.5)' }}>
                <UserOutlined /> {viewerCount} watching
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Timer section */}
        <Card className="glass-card" styles={{ body: { padding: 28, display: 'flex', justifyContent: 'center' } }} style={{ marginBottom: 16 }}>
          {race.status === 'SCHEDULED' && <CountdownTimer seconds={secondsToStart} label="Race Starts In" />}
          {race.status === 'RUNNING' && <CountdownTimer seconds={liveRemaining} label="Time Remaining" />}
          {race.status === 'FINISHED' && (
            <div style={{ textAlign: 'center' }}>
              <FlagFilled style={{ fontSize: 28, color: '#FFB800', marginBottom: 8 }} />
              <Title level={3} style={{ color: '#fff', margin: 0 }}>RACE FINISHED</Title>
              {race.winnerBikeNumber != null && (
                <Text type="secondary">Winner: Bike {String(race.winnerBikeNumber).padStart(2, '0')}</Text>
              )}
            </div>
          )}
        </Card>

        <RaceTrack race={{ ...race, elapsedSeconds: race.status === 'RUNNING' ? liveElapsed : race.elapsedSeconds }} />
      </Content>

      {showWinnerModal && (
        <WinnerModal race={race} onClose={() => setShowWinnerModal(false)} />
      )}
    </Layout>
  );
}
