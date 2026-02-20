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
import { db } from './services/storage';

const App: React.FC = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logsUpdated, setLogsUpdated] = useState(0);
  const [projects, setProjects] = useState(db.getProjects());

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

  // Keyboard shortcut: "N" opens New Log modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;

        // prevent triggering while typing in inputs
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
