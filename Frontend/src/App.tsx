import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { darkGameTheme, lightAdminTheme } from './theme';
import { HomePage } from './pages/HomePage';
import { RacePage } from './pages/RacePage';
import { WinnersPage } from './pages/WinnersPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateRace } from './pages/admin/CreateRace';
import { LiveRaceControl } from './pages/admin/LiveRaceControl';
import { RaceHistory } from './pages/admin/RaceHistory';
import { BikesManagement } from './pages/admin/BikesManagement';
import { Settings } from './pages/admin/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';

function PublicShell({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={darkGameTheme}>{children}</ConfigProvider>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={lightAdminTheme}>{children}</ConfigProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no login required, dark cinematic theme */}
        <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />
        <Route path="/race" element={<PublicShell><RacePage /></PublicShell>} />
        <Route path="/winners" element={<PublicShell><WinnersPage /></PublicShell>} />

        {/* Admin auth - light theme */}
        <Route path="/admin/login" element={<AdminShell><AdminLogin /></AdminShell>} />

        {/* Admin protected routes - light theme */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminShell><AdminLayout /></AdminShell>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-race" element={<CreateRace />} />
            <Route path="/admin/live-race" element={<LiveRaceControl />} />
            <Route path="/admin/race-history" element={<RaceHistory />} />
            <Route path="/admin/bikes" element={<BikesManagement />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
