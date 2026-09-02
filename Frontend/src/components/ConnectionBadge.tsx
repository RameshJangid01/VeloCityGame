import { Tag } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import type { ConnectionStatus } from '../hooks/useRaceConnection';

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connected: { color: 'success', label: 'Connected', spin: false },
    connecting: { color: 'processing', label: 'Connecting', spin: true },
    reconnecting: { color: 'warning', label: 'Reconnecting', spin: true },
    disconnected: { color: 'error', label: 'Connection lost', spin: false },
  }[status];

  return (
    <Tag color={config.color} icon={<SyncOutlined spin={config.spin} />} style={{ borderRadius: 20, padding: '2px 10px' }}>
      {config.label}
    </Tag>
  );
}
