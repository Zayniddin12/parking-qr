import { Routes, Route } from 'react-router-dom';
import { LError } from '@autoparking/ui';
import { RequireAuth } from '@autoparking/auth';
import { config } from './config';
import { Shell } from './layout/Shell';
import { DashboardHome } from './pages/DashboardHome';
import { ListView } from './pages/ListView';
import { TariffView } from './pages/TariffView';
import { ReportsPage } from './pages/ReportsPage';
import { PartnersPage } from './pages/PartnersPage';
import { PartnerDetail } from './pages/PartnerDetail';

/** Business Panel — redesigned light shell (sidebar org-switcher + Dashboard,
 *  White/Black lists, Tariffs, Reports, Partners). */
export function App() {
  const content = (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/whitelist" element={<ListView kind="whitelist" />} />
        <Route path="/blacklist" element={<ListView kind="blacklist" />} />
        <Route path="/tariff" element={<TariffView />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/partners/:id" element={<PartnerDetail />} />
        <Route
          path="*"
          element={<LError code="404" title="Topilmadi" description="Bunday bo‘lim mavjud emas." />}
        />
      </Routes>
    </Shell>
  );

  // Docker/demo can skip the OIDC gate (VITE_AUTH_DISABLED).
  return config.authDisabled ? content : <RequireAuth>{content}</RequireAuth>;
}
