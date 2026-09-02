import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Empty, Space } from 'antd';
import { FlagOutlined, ClockCircleOutlined, SoundOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/raceApi';
import type { AdminRaceDto, BikeDto } from '../../types';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  RUNNING: 'error', SCHEDULED: 'cyan', FINISHED: 'gold', CANCELLED: 'default',
};

export function AdminDashboard() {
  const [races, setRaces] = useState<AdminRaceDto[]>([]);
  const [bikes, setBikes] = useState<BikeDto[]>([]);

  useEffect(() => {
    adminApi.getRaces(1, 100).then(res => setRaces(res.items)).catch(() => {});
    adminApi.getBikes().then(setBikes).catch(() => {});
  }, []);

  const counts = {
    total: races.length,
    scheduled: races.filter(r => r.status === 'SCHEDULED').length,
    live: races.filter(r => r.status === 'RUNNING').length,
    finished: races.filter(r => r.status === 'FINISHED').length,
  };

  const cards = [
    { label: 'Total Races', value: counts.total, icon: <FlagOutlined />, color: '#00A895' },
    { label: 'Scheduled', value: counts.scheduled, icon: <ClockCircleOutlined />, color: '#F79009' },
    { label: 'Live Races', value: counts.live, icon: <SoundOutlined />, color: '#FF4D4F' },
    { label: 'Completed', value: counts.finished, icon: <CheckCircleOutlined />, color: '#12B76A' },
    { label: 'Total Bikes', value: bikes.length, icon: <ThunderboltOutlined />, color: '#FF3D8A' },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Title level={3} style={{ margin: 0 }}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        {cards.map(c => (
          <Col key={c.label} xs={12} sm={8} md={6} lg={4}>
            <Card>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 16 }}>
                {c.icon}
              </div>
              <Statistic value={c.value} valueStyle={{ fontWeight: 800 }} />
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Recent Races">
        {races.length === 0 ? (
          <Empty description="No races yet." />
        ) : (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            {races.slice(0, 6).map(r => (
              <Row key={r.id} justify="space-between" align="middle" style={{ padding: '10px 0', borderBottom: '1px solid #F0F1F3' }}>
                <Col><Text strong>#{r.id.slice(-6)}</Text></Col>
                <Col><Text type="secondary" style={{ fontSize: 13 }}>{new Date(r.startTimeUtc).toLocaleString()}</Text></Col>
                <Col><Tag color={statusColor[r.status]}>{r.status}</Tag></Col>
              </Row>
            ))}
          </Space>
        )}
      </Card>
    </Space>
  );
}
