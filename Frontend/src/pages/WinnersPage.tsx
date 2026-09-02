import { useEffect, useState } from 'react';
import { Layout, Typography, Table, Card, Space, Pagination, Grid, Empty, Spin } from 'antd';
import { TrophyFilled } from '@ant-design/icons';
import { PublicHeader } from '../components/PublicHeader';
import { useRaceConnection } from '../hooks/useRaceConnection';
import { publicApi } from '../services/raceApi';
import type { WinnerHistoryItemDto } from '../types';

const { Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 10;

export function WinnersPage() {
  const { status, viewerCount, race } = useRaceConnection();
  const [items, setItems] = useState<WinnerHistoryItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    setLoading(true);
    publicApi.getWinners(page, PAGE_SIZE).then(res => {
      setItems(res.items);
      setTotalCount(res.totalCount);
    }).finally(() => setLoading(false));
  }, [page]);

  const columns = [
    { title: 'Race', dataIndex: 'raceId', key: 'raceId', render: (id: string) => <Text strong style={{ color: '#fff' }}>#{id.slice(-6)}</Text> },
    { title: 'Date', dataIndex: 'startTimeUtc', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Start Time', dataIndex: 'startTimeUtc', key: 'time', render: (v: string) => new Date(v).toLocaleTimeString() },
    { title: 'Duration', dataIndex: 'durationSeconds', key: 'duration', render: (v: number) => `${v} sec` },
    { title: 'Bikes', dataIndex: 'bikeCount', key: 'bikes' },
    {
      title: 'Winner', key: 'winner',
      render: (_: unknown, w: WinnerHistoryItemDto) => (
        <Text strong style={{ color: '#FFB800' }}>🏆 Bike {String(w.winnerBikeNumber).padStart(2, '0')}</Text>
      ),
    },
  ];

  return (
    <Layout className="dusk-page">
      <PublicHeader status={status} viewerCount={viewerCount} isLive={race?.status === 'RUNNING'} />

      <Content style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: isMobile ? '24px 12px 48px' : '40px 24px 64px' }}>
        <Title level={2} style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <TrophyFilled style={{ color: '#FFB800' }} /> WINNER HISTORY
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>See the results of previous races.</Text>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : items.length === 0 ? (
          <Card className="glass-card" styles={{ body: { padding: 32 } }}>
            <Empty description={<Text type="secondary">No completed races yet.</Text>} />
          </Card>
        ) : isMobile ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {items.map(w => (
              <Card key={w.raceId} className="glass-card" styles={{ body: { padding: 16 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text strong style={{ color: '#fff' }}>🏆 Race #{w.raceId.slice(-6)}</Text>
                  <Text strong style={{ color: '#FFB800' }}>Bike {String(w.winnerBikeNumber).padStart(2, '0')}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {new Date(w.startTimeUtc).toLocaleDateString()} • {new Date(w.startTimeUtc).toLocaleTimeString()}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{w.durationSeconds} seconds • {w.bikeCount} bikes</Text>
              </Card>
            ))}
            <Pagination
              current={page} pageSize={PAGE_SIZE} total={totalCount}
              onChange={setPage} showSizeChanger={false} simple
              style={{ textAlign: 'center', marginTop: 8 }}
            />
          </Space>
        ) : (
          <Card className="glass-card" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="raceId"
              columns={columns}
              dataSource={items}
              pagination={{ current: page, pageSize: PAGE_SIZE, total: totalCount, onChange: setPage, showSizeChanger: false }}
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
}
