import { useEffect, useState } from 'react';
import { Card, Button, Tag, Typography, Space, Row, Col, Alert, Modal, Spin, Empty, Statistic } from 'antd';
import { PlayCircleOutlined, StopOutlined, FlagOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/raceApi';
import { getErrorMessage } from '../../services/api';
import { getRaceConnection } from '../../services/signalr';
import type { AdminRaceDto } from '../../types';
import * as signalR from '@microsoft/signalr';

const { Title, Text } = Typography;

export function LiveRaceControl() {
  const [race, setRace] = useState<AdminRaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'finish' | 'start' | null>(null);
  const [tick, setTick] = useState(0);

  async function loadActiveRace() {
    setLoading(true);
    try {
      const res = await adminApi.getRaces(1, 50);
      const active = res.items.find(r => r.status === 'RUNNING') ?? res.items.find(r => r.status === 'SCHEDULED');
      setRace(active ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActiveRace();
    const conn = getRaceConnection();

    const refresh = () => loadActiveRace();
    conn.on('RaceStarted', refresh);
    conn.on('RaceState', refresh);
    conn.on('RaceFinished', refresh);
    conn.on('RaceCancelled', refresh);

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn.start().catch(() => {});
    }

    const interval = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      conn.off('RaceStarted', refresh);
      conn.off('RaceState', refresh);
      conn.off('RaceFinished', refresh);
      conn.off('RaceCancelled', refresh);
      clearInterval(interval);
    };
  }, []);

  void tick;

  async function runAction(action: 'start' | 'cancel' | 'finish') {
    if (!race) return;
    setActionLoading(action);
    setError(null);
    try {
      if (action === 'start') await adminApi.startRace(race.id);
      if (action === 'cancel') await adminApi.cancelRace(race.id);
      if (action === 'finish') await adminApi.finishRace(race.id);
      await loadActiveRace();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 64 }}><Spin /></div>;

  if (!race) {
    return (
      <div style={{ maxWidth: 640 }}>
        <Title level={3} style={{ marginTop: 0 }}>Live Race</Title>
        <Card><Empty description="No active or scheduled race. Create one to get started." /></Card>
      </div>
    );
  }

  const now = Date.now();
  const startMs = new Date(race.startTimeUtc).getTime();
  const elapsed = race.status === 'RUNNING' ? Math.min(race.durationSeconds, (now - startMs) / 1000) : 0;
  const remaining = Math.max(0, race.durationSeconds - elapsed);
  const secondsToStart = Math.max(0, (startMs - now) / 1000);

  return (
    <div style={{ maxWidth: 640 }}>
      <Title level={3} style={{ marginTop: 0 }}>Live Race Control</Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col><Text strong style={{ fontSize: 18 }}>Race #{race.id.slice(-6)}</Text></Col>
          <Col><Tag color={race.status === 'RUNNING' ? 'error' : 'cyan'} style={{ fontWeight: 700 }}>{race.status}</Tag></Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12}><Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Start Time</Text><div><Text strong>{new Date(race.startTimeUtc).toLocaleString()}</Text></div></Col>
          <Col xs={12}><Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Duration</Text><div><Text strong>{race.durationSeconds}s</Text></div></Col>
          <Col xs={24}><Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Selected Winner</Text><div><Text strong style={{ color: '#F79009' }}>Bike {String(race.winnerBikeNumber).padStart(2, '0')} (confidential until finish)</Text></div></Col>
          <Col xs={24}><Space size={6}><UserOutlined /><Text strong>{race.viewerCount} viewers</Text></Space></Col>
        </Row>

        <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', marginBottom: 16 }}>
          {race.status === 'SCHEDULED' && <Statistic title="Starts In" value={Math.ceil(secondsToStart)} suffix="s" valueStyle={{ fontWeight: 800 }} />}
          {race.status === 'RUNNING' && <Statistic title="Time Remaining" value={Math.ceil(remaining)} suffix="s" valueStyle={{ fontWeight: 800 }} />}
        </Card>

        <Space wrap>
          {race.status === 'SCHEDULED' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setConfirmAction('start')} style={{ background: '#12B76A', borderColor: '#12B76A' }}>
              Start Now
            </Button>
          )}
          {race.status === 'RUNNING' && (
            <Button type="primary" icon={<FlagOutlined />} onClick={() => setConfirmAction('finish')} style={{ background: '#F79009', borderColor: '#F79009' }}>
              Finish Race
            </Button>
          )}
          {race.status !== 'FINISHED' && (
            <Button danger icon={<StopOutlined />} onClick={() => setConfirmAction('cancel')}>
              Cancel Race
            </Button>
          )}
        </Space>
      </Card>

      <Modal
        open={!!confirmAction}
        onCancel={() => setConfirmAction(null)}
        title={<Space><WarningOutlined style={{ color: '#F79009' }} /> Confirm Action</Space>}
        footer={[
          <Button key="back" onClick={() => setConfirmAction(null)}>Back</Button>,
          <Button key="confirm" type="primary" loading={actionLoading !== null} onClick={() => confirmAction && runAction(confirmAction)}>
            Confirm
          </Button>,
        ]}
      >
        <Text type="secondary">
          {confirmAction === 'start' && 'This will immediately start the race for all viewers. This cannot be undone.'}
          {confirmAction === 'cancel' && 'This will cancel the race. It will not appear in winner history.'}
          {confirmAction === 'finish' && 'This will immediately end the race and reveal the winner to all viewers.'}
        </Text>
      </Modal>
    </div>
  );
}
