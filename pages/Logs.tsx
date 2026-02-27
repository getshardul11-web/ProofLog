import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storage';
import { WorkLog, Category, ACCENT_COLORS } from '../types';
import { STATUS_COLORS, CATEGORY_COLORS } from '../constants';
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Tag as TagIcon,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Edit state
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImpact, setEditImpact] = useState('');

  const [accentColor, setAccentColor] = useState('#F4C430');

  useEffect(() => {
    let mounted = true;
    const fetchUserAndLogs = async () => {
      const user = await db.getUser();
      if (!mounted) return;
      if (user) {
        setAccentColor(ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430');
      }
      await loadLogs();
    };
    fetchUserAndLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const loadLogs = async () => {
    const allLogs = await db.getLogs();

    const sorted = [...allLogs].sort((a, b) => {
      const aOrder = (a as any).order ?? null;
      const bOrder = (b as any).order ?? null;

      if (aOrder !== null && bOrder !== null) {
        if (aOrder !== bOrder) return aOrder - bOrder;
      }

      return b.createdAt - a.createdAt;
    });

    setLogs(sorted);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this log? This cannot be undone.')) {
      await db.deleteLog(id);
      loadLogs();
    }
  };

  const openEditModal = (log: WorkLog) => {
    setEditingLog(log);
    setEditTitle(log.title);
    setEditImpact(log.impact);
  };

  const closeEditModal = () => {
    setEditingLog(null);
    setEditTitle('');
    setEditImpact('');
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    const updatedTitle = editTitle.trim();
    const updatedImpact = editImpact.trim();

    if (!updatedTitle) {
      alert('Title cannot be empty.');
      return;
    }

    if (!updatedImpact) {
      alert('Impact cannot be empty.');
      return;
    }

    if ((db as any).updateLog) {
      await (db as any).updateLog(editingLog.id, {
        title: updatedTitle,
        impact: updatedImpact,
      });
    } else {
      const updatedLogs = logs.map((l) =>
        l.id === editingLog.id
          ? { ...l, title: updatedTitle, impact: updatedImpact }
          : l
      );

      if ((db as any).saveLogs) {
        await (db as any).saveLogs(updatedLogs);
      } else if ((db as any).setLogs) {
        await (db as any).setLogs(updatedLogs);
      } else {
        alert(
          'Your db service is missing updateLog/saveLogs. Paste storage.ts and I will fix it.'
        );
        return;
      }
    }

    closeEditModal();
    loadLogs();
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.impact.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === 'All' || log.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, filterCategory]);

  const moveLog = (index: number, direction: 'up' | 'down') => {
    const newLogs = [...logs];

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLogs.length) return;

    const temp = newLogs[index];
    newLogs[index] = newLogs[targetIndex];
    newLogs[targetIndex] = temp;

    const withOrder = newLogs.map((l, idx) => ({
      ...l,
      order: idx,
    }));

    setLogs(withOrder);

    if ((db as any).saveLogs) {
      (db as any).saveLogs(withOrder);
    } else if ((db as any).setLogs) {
      (db as any).setLogs(withOrder);
    } else {
      console.warn('db.saveLogs or db.setLogs missing, ordering not persisted.');
    }
  };

  return (
    <div className="space-y-7 relative">
      {/* Background Pollen Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[40px] right-[80px] w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.14] bg-yellow-200" />
        <div className="absolute top-[220px] left-[40px] w-[360px] h-[360px] rounded-full blur-3xl opacity-[0.12] bg-yellow-200" />
        <div className="absolute top-[140px] left-[520px] w-[320px] h-[320px] rounded-full blur-3xl opacity-[0.10] bg-yellow-100" />
        <div className="absolute bottom-[120px] right-[60px] w-[520px] h-[520px] rounded-full blur-3xl opacity-[0.12] bg-yellow-200" />
        <div className="absolute bottom-[260px] left-[240px] w-[340px] h-[340px] rounded-full blur-3xl opacity-[0.09] bg-yellow-100" />
        <div className="absolute bottom-[60px] right-[520px] w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.08] bg-yellow-100" />

        {/* pollen network lines */}
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.06]"
          viewBox="0 0 1800 950"
          fill="none"
        >
          <circle cx="200" cy="160" r="5" fill="#facc15" />
          <circle cx="460" cy="280" r="5" fill="#facc15" />
          <circle cx="720" cy="200" r="5" fill="#facc15" />
          <circle cx="1040" cy="260" r="5" fill="#facc15" />
          <circle cx="1440" cy="220" r="5" fill="#facc15" />
          <circle cx="1320" cy="620" r="5" fill="#facc15" />
          <circle cx="900" cy="760" r="5" fill="#facc15" />
          <circle cx="520" cy="720" r="5" fill="#facc15" />

          <path
            d="M200 160 L460 280 L720 200 L1040 260 L1440 220"
            stroke="#facc15"
            strokeWidth="2"
          />
          <path
            d="M720 200 L1320 620 L900 760 L520 720 L200 160"
            stroke="#facc15"
            strokeWidth="2"
          />
          <path d="M1040 260 L900 760" stroke="#facc15" strokeWidth="2" />
        </svg>
      </div>

      {/* Search + Filter */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 bg-white/60 backdrop-blur-2xl p-4 rounded-3xl border border-black/30 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search logs, impact, keywords…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-black/30 bg-white/70 backdrop-blur-xl focus:ring-2 focus:ring-slate-300 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <select
            className="pl-11 pr-10 py-3 rounded-2xl border border-black/30 bg-white/70 backdrop-blur-xl outline-none appearance-none text-sm font-semibold text-slate-700 cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative z-10 space-y-10 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-black/70 before:to-transparent">
        {filteredLogs.map((log, idx) => (
          <div
            key={log.id}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Timeline Dot (center aligned to card height) */}
            <div className="flex items-center justify-center w-12 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-12 h-12 rounded-full border border-black bg-white shadow-sm flex items-center justify-center">
                <div
                  className="w-4 h-4 rounded-full shadow-inner"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accentColor} 0%, rgba(255,180,0,0.85) 55%, rgba(255,255,255,0.2) 80%)`,
                  }}
                />
              </div>
            </div>

            {/* Content Card */}
            <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] bg-white/70 backdrop-blur-2xl p-8 rounded-[34px] border border-black/30 shadow-sm hover:shadow-md transition-all">
              {/* Top Row */}
              <div className="flex items-start justify-between gap-6 mb-5">
                <span
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold tracking-tight ${CATEGORY_COLORS[log.category] ||
                    'bg-slate-50 text-slate-700 border border-black/30'
                    }`}
                >
                  {log.category}
                </span>

                <div className="flex items-center gap-3">
                  {/* Timestamp */}
                  <div className="text-sm font-semibold text-slate-400 flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} />
                      {formatDate(log.createdAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      {formatTime(log.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => openEditModal(log)}
                      className="text-slate-300 hover:text-slate-700 transition-colors"
                      title="Edit log"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-[22px] font-semibold tracking-tight text-slate-900 leading-snug">
                {log.title}
              </h3>

              {/* Impact */}
              <p className="text-slate-600 mt-3 text-[15px] leading-relaxed">
                {log.impact}
              </p>

              {/* Metadata */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[log.status]}`}
                >
                  {log.status}
                </div>

                <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold px-4 py-2 rounded-full bg-white/70 border border-black/30">
                  <Clock size={16} />
                  {log.timeSpent}m
                </div>

                {log.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 text-slate-600 text-sm font-semibold bg-white/70 px-4 py-2 rounded-full border border-black/30"
                  >
                    <TagIcon size={14} className="text-slate-400" />
                    {tag}
                  </div>
                ))}
              </div>

              {/* Proof Links */}
              {log.links.length > 0 && (
                <div className="mt-6 pt-5 border-t border-black/20 flex flex-wrap gap-3">
                  {log.links.map((link, lIdx) => (
                    <a
                      key={lIdx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-2xl bg-white/70 border border-black/30 shadow-sm hover:shadow-md transition-all"
                    >
                      <ExternalLink size={16} className="text-slate-400" />
                      Proof link {lIdx + 1}
                    </a>
                  ))}
                </div>
              )}

              {/* Reorder Controls */}
              <div className="mt-6 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => moveLog(idx, 'up')}
                  disabled={idx === 0}
                  className="px-4 py-2.5 rounded-2xl border border-black/30 bg-white/70 text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp size={18} />
                </button>

                <button
                  onClick={() => moveLog(idx, 'down')}
                  disabled={idx === logs.length - 1}
                  className="px-4 py-2.5 rounded-2xl border border-black/30 bg-white/70 text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-20 bg-white/60 backdrop-blur-2xl rounded-3xl border border-black/30 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-white/70 border border-black/30 rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
              <Search size={28} />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
              No logs found
            </h3>

            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm leading-relaxed">
              Try changing your filters, or press{' '}
              <span className="font-semibold">N</span> to log new work.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-6 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-[28px] border border-black/30 shadow-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Edit log
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Update your log details. This will overwrite the existing entry.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-black/30 bg-white outline-none text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Impact / Description
                </label>
                <textarea
                  value={editImpact}
                  onChange={(e) => setEditImpact(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-black/30 bg-white outline-none text-sm font-medium text-slate-800 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDelete(editingLog.id)}
                className="px-5 py-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-all"
              >
                Delete
              </button>

              <div className="flex gap-2">
                <button
                  onClick={closeEditModal}
                  className="px-5 py-3 rounded-2xl border border-black/30 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-3 rounded-2xl font-semibold text-sm text-slate-900 border border-black/30 shadow-sm hover:shadow-md transition-all"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.2) 100%)`,
                  }}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
