import { Typography, Card, Descriptions } from 'antd';
import { API_BASE_URL } from '../../services/api';

const { Title, Text } = Typography;

export function Settings() {
  const email = localStorage.getItem('admin_email') || '—';

  return (
    <div style={{ maxWidth: 480 }}>
      <Title level={3} style={{ marginTop: 0 }}>Settings</Title>
      <Card>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Logged in as">{email}</Descriptions.Item>
          <Descriptions.Item label="API Endpoint"><Text code>{API_BASE_URL}</Text></Descriptions.Item>
          <Descriptions.Item label="Real-time channel"><Text code>/hubs/race</Text></Descriptions.Item>
        </Descriptions>
      </Card>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
        Additional configuration (password change, notification preferences) can be added here as the platform grows.
      </Text>
    </div>
  );
}
