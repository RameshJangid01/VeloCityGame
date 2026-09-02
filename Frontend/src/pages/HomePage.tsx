import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Typography, Button, Card, Space, Row, Col, Grid } from 'antd';
import { TrophyFilled, RightOutlined, UserOutlined } from '@ant-design/icons';
import { useRaceConnection } from '../hooks/useRaceConnection';
import { PublicHeader } from '../components/PublicHeader';
import { publicApi } from '../services/raceApi';
import type { WinnerHistoryItemDto } from '../types';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export function HomePage() {
  const { race, status, viewerCount, getServerNow } = useRaceConnection();
  const [latestWinner, setLatestWinner] = useState<WinnerHistoryItemDto | null>(null);
  const [tick, setTick] = useState(0);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    publicApi.getWinners(1, 1).then(res => setLatestWinner(res.items[0] ?? null)).catch(() => {});
  }, [race?.status]);

  void tick;

  const now = getServerNow();
  const secondsToStart = race ? Math.max(0, (new Date(race.startTimeUtc).getTime() - now.getTime()) / 1000) : 0;

  return (
    <Layout className="dusk-page">
      <PublicHeader status={status} viewerCount={viewerCount} isLive={race?.status === 'RUNNING'} />
      <Content style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: isMobile ? '48px 16px' : '80px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Text style={{ color: '#00E0C6', fontWeight: 700, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Live Motorsport Experience
          </Text>
          <Title level={isMobile ? 2 : 1} style={{ color: '#fff', margin: '12px 0 0', fontWeight: 900, letterSpacing: '-0.01em' }}>
            REAL-TIME BIKE RACING
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginTop: 8 }}>
            Watch the race. Feel the speed.
          </Paragraph>

          <Space size={12} wrap style={{ marginTop: 24, justifyContent: 'center', width: '100%' }}>
            <Link to="/race">
              <Button type="primary" size="large" style={{ background: 'linear-gradient(90deg, #00E0C6, #00A895)', border: 'none', fontWeight: 700, minWidth: 160 }}>
                LIVE RACE
              </Button>
            </Link>
            <Link to="/winners">
              <Button size="large" ghost style={{ fontWeight: 700, minWidth: 160 }}>
                RACE HISTORY
              </Button>
            </Link>
          </Space>
        </div>

        {/* Status card */}
        {race?.status === 'RUNNING' && (
          <Link to="/race">
            <Card className="glass-card" hoverable styles={{ body: { padding: 24 } }} style={{ marginBottom: 20, border: '1px solid rgba(255,77,79,0.25)' }}>
              <Space align="center" style={{ marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4D4F' }} className="animate-pulseGlow" />
                <Text style={{ color: '#FF7875', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>LIVE — RACE IN PROGRESS</Text>
              </Space>
              <Row justify="space-between" align="bottom" gutter={[16, 16]}>
                <Col>
                  <Title level={2} style={{ color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.max(0, Math.ceil(race.durationSeconds - race.elapsedSeconds))}s left
                  </Title>
                  <Text type="secondary">{race.bikes.length} bikes racing</Text>
                </Col>
                <Col>
                  <Space size={4} style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <UserOutlined /> {viewerCount} watching
                  </Space>
                </Col>
              </Row>
              <Text style={{ color: '#00E0C6', fontWeight: 700, fontSize: 13, display: 'block', marginTop: 12 }}>
                WATCH LIVE <RightOutlined style={{ fontSize: 11 }} />
              </Text>
            </Card>
          </Link>
        )}

        {race?.status === 'SCHEDULED' && (
          <Link to="/race">
            <Card className="glass-card" hoverable styles={{ body: { padding: 24 } }} style={{ marginBottom: 20 }}>
              <Text style={{ color: '#00E0C6', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>UPCOMING RACE</Text>
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Starts In</Text>
                <Title level={2} style={{ color: '#fff', margin: '2px 0 12px', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(secondsToStart * 1000).toISOString().substring(14, 19)}
                </Title>
              </div>
              <Space size={24} wrap style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Start: {new Date(race.startTimeUtc).toLocaleTimeString()}</span>
                <span>Duration: {race.durationSeconds}s</span>
                <span>Bikes: {race.bikes.length}</span>
              </Space>
              <Text style={{ color: '#00E0C6', fontWeight: 700, fontSize: 13, display: 'block', marginTop: 12 }}>
                WATCH RACE <RightOutlined style={{ fontSize: 11 }} />
              </Text>
            </Card>
          </Link>
        )}

        {race?.status === 'FINISHED' && (
          <Link to="/race">
            <Card className="glass-card" hoverable styles={{ body: { padding: 24 } }} style={{ marginBottom: 20 }}>
              <Text style={{ color: '#FFB800', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>
                <TrophyFilled /> LAST RACE RESULT
              </Text>
              <Title level={2} style={{ color: '#fff', margin: '12px 0' }}>
                WINNER — BIKE {String(race.winnerBikeNumber).padStart(2, '0')}
              </Title>
              <Space size={24} wrap style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Race #{race.raceId.slice(-6)}</span>
                <span>Duration: {race.durationSeconds}s</span>
              </Space>
              <Text style={{ color: '#00E0C6', fontWeight: 700, fontSize: 13, display: 'block', marginTop: 12 }}>
                WATCH NEXT RACE <RightOutlined style={{ fontSize: 11 }} />
              </Text>
            </Card>
          </Link>
        )}

        {!race && (
          <Card className="glass-card" styles={{ body: { padding: 32, textAlign: 'center' } }} style={{ marginBottom: 20 }}>
            <Text type="secondary">No races available yet.</Text>
          </Card>
        )}

        {/* Latest winner card */}
        <Card className="glass-card" styles={{ body: { padding: 24 } }}>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Latest Winner</Text>
          {latestWinner ? (
            <Row justify="space-between" align="middle" gutter={[12, 12]} style={{ marginTop: 12 }}>
              <Col>
                <Space size={12} align="center">
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD666, #FFB800)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TrophyFilled style={{ fontSize: 20, color: '#101828' }} />
                  </div>
                  <div>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>BIKE {String(latestWinner.winnerBikeNumber).padStart(2, '0')}</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Race #{latestWinner.raceId.slice(-6)} • Won at {latestWinner.finishedAtUtc ? new Date(latestWinner.finishedAtUtc).toLocaleTimeString() : '--'}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Link to="/winners" style={{ color: '#00E0C6', fontWeight: 700, fontSize: 13 }}>
                  VIEW RESULT <RightOutlined style={{ fontSize: 11 }} />
                </Link>
              </Col>
            </Row>
          ) : (
            <div style={{ marginTop: 12 }}><Text type="secondary">No completed races yet.</Text></div>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
