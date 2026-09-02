import { useEffect, useState } from 'react';
import { Typography, Input, Select, Table, Card, Space, Modal, Descriptions, Tag, Grid, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/raceApi';
import type { AdminRaceDto } from '../../types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  RUNNING: 'error', SCHEDULED: 'cyan', FINISHED: 'gold', CANCELLED: 'default',
};

export function RaceHistory() {
  const [races, setRaces] = useState<AdminRaceDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminRaceDto | null>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    setLoading(true);
    adminApi.getRaces(page, PAGE_SIZE, statusFilter)
      .then(res => { setRaces(res.items); setTotalCount(res.totalCount); })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const filtered = search
    ? races.filter(r => r.id.toLowerCase().includes(search.toLowerCase()) || r.winnerBikeNumber?.toString().includes(search))
    : races;

  const columns = [
    { title: 'Race ID', dataIndex: 'id', key: 'id', render: (id: string) => <Text strong>#{id.slice(-6)}</Text> },
    { title: 'Date', dataIndex: 'startTimeUtc', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Start Time', dataIndex: 'startTimeUtc', key: 'time', render: (v: string) => new Date(v).toLocaleTimeString() },
    { title: 'Duration', dataIndex: 'durationSeconds', key: 'duration', render: (v: number) => `${v}s` },
    { title: 'Bikes', key: 'bikes', render: (_: unknown, r: AdminRaceDto) => r.bikes.length },
    { title: 'Winner', key: 'winner', render: (_: unknown, r: AdminRaceDto) => <Text strong style={{ color: '#F79009' }}>Bike {String(r.winnerBikeNumber ?? '--').padStart(2, '0')}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={3} style={{ margin: 0 }}>Race History</Title>

      <Space wrap style={{ width: '100%' }}>
        <Input
          placeholder="Search by race ID or bike number..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: isMobile ? '100%' : 280 }}
        />
        <Select
          allowClear
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          style={{ width: isMobile ? '100%' : 160 }}
          options={[
            { value: 'SCHEDULED', label: 'Scheduled' },
            { value: 'RUNNING', label: 'Running' },
            { value: 'FINISHED', label: 'Finished' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />
      </Space>

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {filtered.length === 0 && !loading ? (
          <Empty description="No races found." style={{ padding: 32 }} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            onRow={(record) => ({ onClick: () => setSelected(record) })}
            scroll={{ x: isMobile ? 700 : undefined }}
            pagination={{ current: page, pageSize: PAGE_SIZE, total: totalCount, onChange: setPage, showSizeChanger: false }}
          />
        )}
      </Card>

      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} title={selected ? `Race #${selected.id.slice(-6)} Details` : ''}>
        {selected && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Status"><Tag color={statusColor[selected.status]}>{selected.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Start Time">{new Date(selected.startTimeUtc).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Duration">{selected.durationSeconds}s</Descriptions.Item>
            <Descriptions.Item label="Winner"><Text strong style={{ color: '#F79009' }}>Bike {String(selected.winnerBikeNumber).padStart(2, '0')}</Text></Descriptions.Item>
            <Descriptions.Item label="Bikes">{selected.bikes.length}</Descriptions.Item>
            <Descriptions.Item label="Finished At">{selected.finishedAt ? new Date(selected.finishedAt).toLocaleString() : '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
}
