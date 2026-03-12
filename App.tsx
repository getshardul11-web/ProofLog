import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LogForm from './components/LogForm';
import Login from './pages/Login';
import { supabase } from './services/supabase';

// ⚡ helper to allow preloading of lazy routes
function lazyWithPreload(factory: any) {
  const Component: any = lazy(factory);
  Component.preload = factory;
  return Component;
}

// 🚀 Lazy-loaded pages with preload capability (for hover prefetch)
const Dashboard = lazyWithPreload(() => import('./pages/Dashboard'));
const Logs = lazyWithPreload(() => import('./pages/Logs'));
const Projects = lazyWithPreload(() => import('./pages/Projects'));
const Reports = lazyWithPreload(() => import('./pages/Reports'));
const Analytics = lazyWithPreload(() => import('./pages/Analytics'));
const Settings = lazyWithPreload(() => import('./pages/Settings'));

const App: React.FC = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logsUpdated, setLogsUpdated] = useState(0);

  // 🔐 Auth state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleLogSaved = () => {
    setLogsUpdated((prev) => prev + 1);
    setShowLogModal(false);
  };

  // ⌨️ Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;

        if (
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.tagName === 'SELECT' ||
          target?.isContentEditable
        ) {
          return;
        }

        setShowLogModal(true);
      }

      if (e.key === 'Escape') {
        setShowLogModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🚀 warm critical routes after first paint
  useEffect(() => {
    const timer = setTimeout(() => {
      Dashboard.preload?.();
      Logs.preload?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // 🔐 Supabase auth listener (NON-BLOCKING)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 🔔 Reminder notification engine
  useEffect(() => {
    if (!session?.user?.id) return;
    if (!('Notification' in window)) return;

    const userId = session.user.id;

    const checkReminder = () => {
      if (Notification.permission !== 'granted') return;

      const raw = localStorage.getItem(`pollen-reminder-${userId}`);
      if (!raw) return;

      try {
        const config = JSON.parse(raw);
        if (!config.enabled) return;

        const currentDay = new Date().getDay(); // 0=Sun … 6=Sat
        if (!Array.isArray(config.days) || !config.days.includes(currentDay)) return;

        const intervalMs = (config.intervalMinutes || 60) * 60 * 1000;
        const lastFired  = config.lastFired || 0;

        if (Date.now() - lastFired < intervalMs) return;

        // Fire notification
        new Notification('Time to log your work! 🌸', {
          body: 'Keep your streak going — what did you just finish?',
          icon: '/favicon.svg',
        });

        config.lastFired = Date.now();
        localStorage.setItem(`pollen-reminder-${userId}`, JSON.stringify(config));
      } catch {
        // malformed config — ignore
      }
    };

    // Check immediately, then every 30 seconds
    checkReminder();
    const ticker = setInterval(checkReminder, 30_000);
    return () => clearInterval(ticker);
  }, [session]);

  // ✅ Gate login only after auth resolved
  if (!authLoading && !session) {
    return <Login />;
  }

  // 🚀 Always render app shell fast
  return (
    <Router>
      <Layout onOpenLogModal={() => setShowLogModal(true)}>
        <Suspense
          fallback={
            <div className="w-full h-[60vh] flex items-center justify-center text-slate-500 font-semibold">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Dashboard key={logsUpdated} />} />
            <Route path="/logs" element={<Logs key={logsUpdated} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/analytics" element={<Analytics key={logsUpdated} />} />
            <Route path="/reports" element={<Reports key={logsUpdated} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>

      {showLogModal && (
        <LogForm
          onClose={() => setShowLogModal(false)}
          onSaved={handleLogSaved}
        />
      )}
    </Router>
  );
};

export default App;