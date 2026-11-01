import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { DashboardProvider } from '@/context/DashboardContext';
import OverviewPage from '@/pages/OverviewPage';
import LiveFeedPage from '@/pages/LiveFeedPage';
import PumpsPage from '@/pages/PumpsPage';
import SalesPage from '@/pages/SalesPage';
import StaffPage from '@/pages/StaffPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setAllowed(null);
      return;
    }
    supabase.rpc('is_manager').then(({ data }) => {
      if (data === true) {
        setNotice(undefined);
        setAllowed(true);
      } else {
        setNotice('ບັນຊີນີ້ບໍ່ມີສິດຜູ້ຈັດການ');
        setAllowed(false);
        supabase.auth.signOut();
      }
    });
  }, [session]);

  if (session === undefined || (session && allowed === null)) {
    return <div style={{ padding: 40, color: 'var(--color-text-secondary)' }}>ກຳລັງໂຫຼດ...</div>;
  }
  if (!session || !allowed) return <LoginPage notice={notice} />;

  return (
    <DashboardProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout email={session.user.email ?? ''} />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/live" element={<LiveFeedPage />} />
            <Route path="/pumps" element={<PumpsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </DashboardProvider>
  );
}
