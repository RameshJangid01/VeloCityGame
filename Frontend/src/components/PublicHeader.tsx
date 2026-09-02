import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, Space, Grid } from 'antd';
import { MenuOutlined, LoginOutlined } from '@ant-design/icons';
import { Logo } from './Logo';
import { ConnectionBadge } from './ConnectionBadge';
import type { ConnectionStatus } from '../hooks/useRaceConnection';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const navItems = [
  { key: '/', label: 'Home' },
  { key: '/race', label: 'Live Race' },
  { key: '/winners', label: 'Winners' },
];

export function PublicHeader({ status, viewerCount, isLive }: { status: ConnectionStatus; viewerCount: number; isLive: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = !screens.md;

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10,14,23,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
        height: 68,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <Logo size={isMobile ? 26 : 32} variant="dark" />
      </Link>

      {!isMobile && (
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={(e) => navigate(e.key)}
          theme="dark"
          style={{ background: 'transparent', borderBottom: 'none', flex: 1, justifyContent: 'center', minWidth: 0 }}
        />
      )}

      <Space size={isMobile ? 8 : 16}>
        {isLive && !isMobile && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{viewerCount} watching</span>
        )}
        <ConnectionBadge status={status} />
        {!isMobile && (
          <Button icon={<LoginOutlined />} onClick={() => navigate('/admin/login')}>
            Admin Login
          </Button>
        )}
        {isMobile && (
          <Button type="text" icon={<MenuOutlined style={{ color: '#fff' }} />} onClick={() => setDrawerOpen(true)} />
        )}
      </Space>

      <Drawer
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0, background: '#111726' }, header: { background: '#111726', borderBottom: '1px solid #232B41' } }}
        title={<Logo size={24} variant="dark" />}
        closeIcon={<span style={{ color: '#fff' }}>✕</span>}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={(e) => { navigate(e.key); setDrawerOpen(false); }}
          theme="dark"
          style={{ background: 'transparent', border: 'none' }}
        />
        <div style={{ padding: 16 }}>
          <Button
            block
            icon={<LoginOutlined />}
            onClick={() => { navigate('/admin/login'); setDrawerOpen(false); }}
          >
            Admin Login
          </Button>
        </div>
      </Drawer>
    </Header>
  );
}
