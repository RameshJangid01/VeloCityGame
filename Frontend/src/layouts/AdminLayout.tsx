import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, Grid, Typography, Space, Avatar } from 'antd';
import {
  DashboardOutlined, PlusCircleOutlined, SoundOutlined, HistoryOutlined,
  ThunderboltOutlined, SettingOutlined, LogoutOutlined, MenuOutlined, EyeOutlined, UserOutlined,
} from '@ant-design/icons';
import { Logo } from '../components/Logo';
import { useAdminAuth } from '../hooks/useAdminAuth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const navItems = [
  { key: '/admin/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/admin/create-race', label: 'Create Race', icon: <PlusCircleOutlined /> },
  { key: '/admin/live-race', label: 'Live Race', icon: <SoundOutlined /> },
  { key: '/admin/race-history', label: 'Race History', icon: <HistoryOutlined /> },
  { key: '/admin/bikes', label: 'Bikes', icon: <ThunderboltOutlined /> },
  { key: '/admin/settings', label: 'Settings', icon: <SettingOutlined /> },
];

export function AdminLayout() {
  const { logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverTime, setServerTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const email = localStorage.getItem('admin_email') || 'admin';

  const menu = (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[location.pathname]}
      items={navItems}
      onClick={(e) => { navigate(e.key); setDrawerOpen(false); }}
      style={{ background: 'transparent', border: 'none', flex: 1 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider width={230} style={{ background: '#0F1420', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 12px' }}>
            <Logo size={26} variant="dark" />
          </div>
          {menu}
          <div style={{ padding: 16 }}>
            <Button block icon={<LogoutOutlined />} onClick={logout} danger ghost>
              Logout
            </Button>
          </div>
        </Sider>
      )}

      <Layout>
        <Header style={{ background: '#fff', padding: isMobile ? '0 12px' : '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(16,24,40,0.06)' }}>
          <Space>
            {isMobile && (
              <>
                <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
                <Logo size={22} variant="light" showWordmark={!screens.sm ? false : true} />
              </>
            )}
          </Space>

          <Space size={isMobile ? 8 : 16}>
            <Button icon={<EyeOutlined />} onClick={() => window.open('/', '_blank')}>
              {isMobile ? '' : 'View Live Race'}
            </Button>
            {!isMobile && <Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{serverTime.toLocaleTimeString()}</Text>}
            {!isMobile && (
              <Space size={6}>
                <Avatar size={28} icon={<UserOutlined />} style={{ background: '#00A895' }} />
                <Text strong>{email}</Text>
              </Space>
            )}
          </Space>
        </Header>

        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{ body: { padding: 0, background: '#0F1420', display: 'flex', flexDirection: 'column' }, header: { background: '#0F1420', borderBottom: '1px solid rgba(255,255,255,0.08)' } }}
          title={<Logo size={22} variant="dark" />}
          closeIcon={<span style={{ color: '#fff' }}>✕</span>}
        >
          {menu}
          <div style={{ padding: 16 }}>
            <Button block icon={<LogoutOutlined />} onClick={logout} danger ghost>
              Logout
            </Button>
          </div>
        </Drawer>

        <Content style={{ padding: isMobile ? 16 : 24, background: '#F5F7FA' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
