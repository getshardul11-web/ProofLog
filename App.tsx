import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LogForm from './components/LogForm';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { db } from './services/storage';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logsUpdated, setLogsUpdated] = useState(0);
  const [projects, setProjects] = useState(db.getProjects());

  // 🔐 Auth state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshProjects = () => {
    setProjects(db.getProjects());
  };

  const handleLogSaved = () => {
    setLogsUpdated((prev) => prev + 1);
    refreshProjects();
    setShowLogModal(false);
  };

  useEffect(() => {
    refreshProjects();
  }, [showLogModal]);

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

  // 🔐 Supabase auth listener (HARDENED)
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

  // 🟡 Proper loading screen (IMPORTANT — no blank screen)
  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-slate-600 font-semibold">Loading…</div>
      </div>
    );
  }

  // 🔐 Not logged in
  if (!session) {
    return <Login />;
  }

  // ✅ Logged in app
  return (
    <Router>
      <Layout onOpenLogModal={() => setShowLogModal(true)}>
        <Routes>
          <Route path="/" element={<Dashboard key={logsUpdated} />} />
          <Route path="/logs" element={<Logs key={logsUpdated} />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/analytics" element={<Analytics key={logsUpdated} />} />
          <Route path="/reports" element={<Reports key={logsUpdated} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {showLogModal && (
        <LogForm
          onClose={() => setShowLogModal(false)}
          onSaved={handleLogSaved}
          projects={projects}
        />
      )}
    </Router>
  );
};

export default App;