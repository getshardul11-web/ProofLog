import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storage';
import { supabase } from '../services/supabase';
import { WorkLog, Category, Status, ACCENT_COLORS } from '../types';
import { STATUS_COLORS, CATEGORY_COLORS } from '../constants';
import { getAllCategories } from '../services/categories';
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
  ChevronLeft,
  ChevronRight,
  LayoutList,
  X,
} from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImpact, setEditImpact] = useState('');

  const [accentColor, setAccentColor] = useState('#F4C430');
  const [allCategories, setAllCategories] = useState<string[]>(Object.values(Category));

  useEffect(() => {
    let mounted = true;
    const fetchUserAndLogs = async () => {
      const user = await db.getUser();
      if (!mounted) return;
      if (user) {
        setAccentColor(ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430');
      }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (mounted && authUser) {
        setAllCategories(getAllCategories(authUser.id));
      }
      await loadLogs();
    };
    fetchUserAndLogs();
    return () => { mounted = false; };
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
    if (!updatedTitle) { alert('Title cannot be empty.'); return; }
    if (!updatedImpact) { alert('Impact cannot be empty.'); return; }
    if ((db as any).updateLog) {
      await (db as any).updateLog(editingLog.id, { title: updatedTitle, impact: updatedImpact });
    } else {
      const updatedLogs = logs.map((l) =>
        l.id === editingLog.id ? { ...l, title: updatedTitle, impact: updatedImpact } : l
      );
      if ((db as any).saveLogs) await (db as any).saveLogs(updatedLogs);
      else if ((db as any).setLogs) await (db as any).setLogs(updatedLogs);
      else { alert('db.saveLogs missing'); return; }
    }
    closeEditModal();
    loadLogs();
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.impact.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || log.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [logs, searchTerm, filterCategory, filterStatus]);

  const moveLog = (index: number, direction: 'up' | 'down') => {
    const newLogs = [...logs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLogs.length) return;
    const temp = newLogs[index];
    newLogs[index] = newLogs[targetIndex];
    newLogs[targetIndex] = temp;
    const withOrder = newLogs.map((l, idx) => ({ ...l, order: idx }));
    setLogs(withOrder);
    if ((db as any).saveLogs) (db as any).saveLogs(withOrder);
    else if ((db as any).setLogs) (db as any).setLogs(withOrder);
    else console.warn('db.saveLogs or db.setLogs missing, ordering not persisted.');
  };

  // ── Calendar helpers ──────────────────────────────────────────
  const logsByDate = useMemo(() => {
    const map: Record<string, WorkLog[]> = {};
    filteredLogs.forEach((log) => {
      const d = new Date(log.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [filteredLogs]);

  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (logsByDate[key] || []).slice().sort((a, b) => a.createdAt - b.createdAt);
  }, [selectedDate, logsByDate]);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // Monday = 0
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(calYear, calMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const todayNow = new Date();
  const todayKey = `${todayNow.getFullYear()}-${todayNow.getMonth()}-${todayNow.getDate()}`;
  const isToday = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;

  return (
    <div className="space-y-5">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search logs, impact, keywords…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <select
            className="pl-9 pr-8 py-3 rounded-2xl border border-slate-200 bg-white outline-none appearance-none text-sm font-semibold text-slate-700 cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <select
            className="pl-9 pr-8 py-3 rounded-2xl border border-slate-200 bg-white outline-none appearance-none text-sm font-semibold text-slate-700 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All statuses</option>
            {Object.values(Status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 gap-1 shrink-0">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'timeline' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutList size={14} />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} />
            Calendar
          </button>
        </div>
      </div>

      {/* ── TIMELINE VIEW ───────────────────────────────── */}
      {viewMode === 'timeline' && (
        <div className="relative space-y-10 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {filteredLogs.map((log, idx) => (
            <div
              key={log.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Timeline Dot */}
              <div className="flex items-center justify-center w-12 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                  <div
                    className="w-4 h-4 rounded-full shadow-inner"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${accentColor} 0%, rgba(255,180,0,0.85) 55%, rgba(255,255,255,0.2) 80%)`,
                    }}
                  />
                </div>
              </div>

              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <span
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-semibold tracking-tight flex-shrink-0 ${
                      CATEGORY_COLORS[log.category] || 'bg-slate-50 text-slate-700 border border-black/30'
                    }`}
                  >
                    {log.category}
                  </span>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-xs sm:text-sm font-semibold text-slate-400 flex items-center gap-2 sm:gap-4">
                      <span className="hidden sm:flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(log.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditModal(log)} className="text-slate-300 hover:text-slate-700 transition-colors" title="Edit log">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(log.id)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Delete log">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="text-[22px] font-semibold tracking-tight text-slate-900 leading-snug">{log.title}</h3>
                <p className="text-slate-600 mt-3 text-[15px] leading-relaxed">{log.impact}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[log.status]}`}>{log.status}</div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
                    <Clock size={16} />
                    {log.timeSpent}m
                  </div>
                  {log.tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-2 text-slate-600 text-sm font-semibold bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                      <TagIcon size={14} className="text-slate-400" />
                      {tag}
                    </div>
                  ))}
                </div>

                {log.links.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
                    {log.links.map((link, lIdx) => (
                      <a key={lIdx} href={link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <ExternalLink size={16} className="text-slate-400" />
                        Proof link {lIdx + 1}
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => moveLog(idx, 'up')} disabled={idx === 0}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button onClick={() => moveLog(idx, 'down')} disabled={idx === logs.length - 1}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">No logs found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm leading-relaxed">
                Try changing your filters, or press <span className="font-semibold">N</span> to log new work.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR VIEW ───────────────────────────────── */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-[16px] font-semibold text-slate-900">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {DAY_LABELS.map((day) => (
              <div key={day} className="py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {Array.from({ length: Math.ceil(calendarCells.length / 7) }, (_, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
              {calendarCells.slice(wIdx * 7, wIdx * 7 + 7).map((day, dIdx) => {
                if (!day) {
                  return <div key={dIdx} className="min-h-[110px] bg-slate-50/40 border-r border-slate-100 last:border-r-0" />;
                }
                const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayLogs = logsByDate[dayKey] || [];
                const today = isToday(day);
                const isSelected = selectedDate &&
                  selectedDate.getFullYear() === day.getFullYear() &&
                  selectedDate.getMonth() === day.getMonth() &&
                  selectedDate.getDate() === day.getDate();
                return (
                  <div
                    key={dIdx}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`min-h-[110px] p-2 border-r border-slate-100 last:border-r-0 transition-colors cursor-pointer ${isSelected ? 'bg-amber-50' : 'hover:bg-amber-50/30'}`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1.5 transition-colors ${
                      today ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayLogs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-1 text-[11px] rounded-lg px-1.5 py-1 bg-amber-50 border border-amber-100 cursor-default group/item"
                          title={log.title}
                        >
                          <span className="text-slate-400 font-normal shrink-0 tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="truncate font-medium text-slate-700">{log.title}</span>
                        </div>
                      ))}
                      {dayLogs.length > 3 && (
                        <div className="text-[10px] font-semibold text-amber-600 px-1.5">
                          +{dayLogs.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              No logs in this period.
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────── */}
      {editingLog && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-6 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-[28px] border border-black/10 shadow-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Edit log</h3>
                <p className="text-sm text-slate-500 mt-1">Update your log details.</p>
              </div>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Impact / Description</label>
                <textarea
                  value={editImpact}
                  onChange={(e) => setEditImpact(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800 resize-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={() => handleDelete(editingLog.id)} className="px-5 py-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-all">
                Delete
              </button>
              <div className="flex gap-2">
                <button onClick={closeEditModal} className="px-5 py-3 rounded-2xl border border-black/10 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="px-5 py-3 rounded-2xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Day Detail Modal ──────────────────────────────── */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
            style={{ animation: 'logFormIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDayLogs.length === 0
                    ? 'No logs on this day'
                    : `${selectedDayLogs.length} log${selectedDayLogs.length !== 1 ? 's' : ''} · sorted by time`}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Log list */}
            <div className="overflow-y-auto px-6 py-4 flex-1 space-y-2">
              {selectedDayLogs.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No logs on this day.</p>
              ) : (
                selectedDayLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 mt-0.5 shrink-0 tabular-nums w-16">
                      {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{log.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{log.category} · {log.status} · {log.timeSpent}m</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
