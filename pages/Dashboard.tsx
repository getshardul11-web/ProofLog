import { supabase } from '../services/supabase';
import { Timer, CalendarDays, CheckCircle2, FolderKanban, Flame } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { WorkLog, Project, ACCENT_COLORS, Category } from '../types';
import { STATUS_COLORS, CATEGORY_COLORS } from '../constants';
import { Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const StatCard = ({
  label,
  value,
  subValue,
  icon,
  iconBg,
  accentColor,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
}) => (
  <div className="bg-white px-3 sm:px-6 py-3 sm:py-5 rounded-[22px] border border-black/15 shadow-sm flex items-center gap-3 sm:gap-5">
    {/* ICON BLOCK */}
    <div
      className="w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[22px] sm:[&>svg]:h-[22px]"
      style={{
        background: iconBg,
        border: `1.5px solid ${accentColor}`,
      }}
    >
      {icon}
    </div>

    {/* CONTENT */}
    <div className="flex flex-col justify-center leading-tight min-w-0">
      <p className="text-[11px] sm:text-[12px] font-bold text-slate-900 truncate">{label}</p>

      <div className="mt-0.5 sm:mt-1 flex items-baseline gap-1 sm:gap-2 flex-wrap">
        <h3 className="text-[17px] sm:text-[22px] font-semibold tracking-tight text-slate-600">
          {value}
        </h3>

        {subValue && (
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{subValue}</span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);


  const accentColor = '#F4C430';

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      // fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      // fetch logs
      const { data: logsData } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      setProjects(projectsData || []);
      setLogs(
        (logsData || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id ?? row.userId ?? '',
          title: row.title,
          impact: row.impact,
          category: row.category,
          status: row.status,
          timeSpent: row.time_spent ?? row.timeSpent ?? 0,
          tags: row.tags || [],
          links: row.links || [],
          projectId: row.project_id ?? row.projectId ?? '',
          proofUrl: row.proof_url ?? row.proofUrl,
          createdAt: row.created_at
            ? new Date(row.created_at).getTime()
            : row.createdAt || Date.now(),
        }))
      );
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // ---- Time helpers
  const isSameDay = (a: number, b: number) => {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const startOfWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  };

  const todayLogs = useMemo(() => {
    return logs.filter((l) => isSameDay(l.createdAt, Date.now()));
  }, [logs]);

  const weekLogs = useMemo(() => {
    const start = startOfWeek();
    return logs.filter((l) => l.createdAt >= start);
  }, [logs]);

  const totalTimeAll = logs.reduce((acc, l) => acc + l.timeSpent, 0);
  const totalTimeWeek = weekLogs.reduce((acc, l) => acc + l.timeSpent, 0);
  const totalTimeToday = todayLogs.reduce((acc, l) => acc + l.timeSpent, 0);

  const totalHoursAll = Math.floor(totalTimeAll / 60);
  const totalMinsAll = totalTimeAll % 60;

  const totalHoursWeek = Math.floor(totalTimeWeek / 60);
  const totalMinsWeek = totalTimeWeek % 60;

  const totalHoursToday = Math.floor(totalTimeToday / 60);
  const totalMinsToday = totalTimeToday % 60;

  const completedLogs = logs.filter((l) => l.status === 'Done').length;

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

  // ---- Streak logic
  const streakDays = useMemo(() => {
    const logDays = new Set<string>();

    logs.forEach((log) => {
      const d = new Date(log.createdAt);
      logDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    while (true) {
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      if (logDays.has(key)) {
        streak += 1;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [logs]);

  // ---- Category breakdown (minutes)
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(Category).forEach((cat) => (counts[cat] = 0));

    weekLogs.forEach((log) => {
      counts[log.category] = (counts[log.category] || 0) + log.timeSpent;
    });

    return Object.entries(counts)
      .map(([name, minutes]) => ({ name, value: minutes }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [weekLogs]);

  const topCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[0].name : '—';

  // ---- Effort Trend Data (last 7 days)
  const effortTrendData = useMemo(() => {
    const days: { label: string; minutes: number; dateKey: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

      const minutes = logs
        .filter((l) => {
          const ld = new Date(l.createdAt);
          const lk = `${ld.getFullYear()}-${ld.getMonth()}-${ld.getDate()}`;
          return lk === key;
        })
        .reduce((acc, l) => acc + l.timeSpent, 0);

      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes,
        dateKey: key,
      });
    }

    return days;
  }, [logs]);

  // ---- Pie Colors (same vibe as analytics)
  const pieColors = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444'];




  return (
    <div className="w-full space-y-6">
      {/* HERO ROW */}
      <div className="flex items-start justify-between gap-10">
        <div>
          <h1
            className="text-[26px] sm:text-[32px] md:text-[38px] font-semibold tracking-tight"
            style={{ color: accentColor }}
          >
            Welcome to Pollen.
          </h1>
        </div>

        <div className="flex-1 flex justify-end">
        </div>
      </div>

      {/* TOP STATS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 mb-5">
  <StatCard
    label="Today"
    value={`${totalHoursToday}h ${totalMinsToday}m`}
    subValue={`${todayLogs.length} logs`}
    icon={<Timer size={22} className="text-black" />}
    iconBg="white"
    accentColor={accentColor}
  />

  <StatCard
    label="This week"
    value={`${totalHoursWeek}h ${totalMinsWeek}m`}
    subValue={`${weekLogs.length} logs`}
    icon={<CalendarDays size={22} className="text-black" />}
    iconBg="white"
    accentColor={accentColor}
  />

  <StatCard
    label="Completed"
    value={completedLogs}
    subValue="all time"
    icon={<CheckCircle2 size={22} className="text-black" />}
    iconBg="white"
    accentColor={accentColor}
  />

  <StatCard
    label="Projects"
    value={projects.length}
    subValue="active"
    icon={<FolderKanban size={22} className="text-black" />}
    iconBg="white"
    accentColor={accentColor}
  />

  <StatCard
    label="Streak"
    value={`${streakDays} days`}
    subValue="current"
    icon={<Flame size={22} className="text-black" />}
    iconBg="white"
    accentColor={accentColor}
  />
</section>


      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Active Projects */}
        <div className="lg:col-span-4 bg-white rounded-[26px] border border-black/15 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Active projects
            </h2>
            <Link
              to="/projects"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {projects.slice(0, 5).map((project) => {
              const projectLogs = logs.filter((l) => l.projectId === project.id);
              const projectTime = projectLogs.reduce((acc, l) => acc + l.timeSpent, 0);
              const hrs = Math.floor(projectTime / 60);
              const mins = projectTime % 60;
              const hasActivity = projectTime > 0;

              return (
                <div key={project.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}18`, border: `1.5px solid ${project.color}40` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800 text-sm truncate">{project.name}</span>
                      <span className="text-xs font-semibold text-slate-400 ml-2 shrink-0">
                        {hasActivity ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : '—'}
                      </span>
                    </div>
                    <div className="mt-1.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: hasActivity ? `${Math.min(100, (projectTime / 600) * 100)}%` : '0%',
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{projectLogs.length} log{projectLogs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No projects yet.</p>
            )}
          </div>
        </div>

        {/* Effort Trend */}
        <div className="lg:col-span-5 bg-white rounded-[26px] border border-black/15 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Effort trend
            </h2>
            <p className="text-xs font-semibold text-slate-400">last 7 days</p>
          </div>

          <div className="mt-6 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={effortTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke={accentColor}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Focus */}
        <div className="lg:col-span-3 bg-white rounded-[26px] border border-black/15 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-slate-900">Daily focus</h2>
            <span className="text-[11px] font-semibold text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Circular Progress Ring */}
          <div className="flex-1 flex items-center justify-center py-4">
            {(() => {
              const GOAL = 240; // 4h daily goal in minutes
              const pct = Math.min(1, totalTimeToday / GOAL);
              const R = 46;
              const circ = 2 * Math.PI * R;
              const progressDash = circ * pct;
              const progressGap = circ - progressDash;
              return (
                <div className="relative" style={{ width: 128, height: 128 }}>
                  <svg width="128" height="128" viewBox="0 0 120 120">
                    {/* Track ring */}
                    <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                    {/* Progress ring */}
                    {pct > 0 && (
                      <circle
                        cx="60" cy="60" r={R}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${progressDash} ${progressGap}`}
                        transform="rotate(-90 60 60)"
                      />
                    )}
                  </svg>
                  {/* Center label — HTML for reliable centering */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[16px] font-bold text-slate-800 leading-none">
                      {totalHoursToday}h {totalMinsToday}m
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-1">
                      of 4h goal
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stat Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-2xl">
              <span className="text-xs font-semibold text-slate-500">Logs today</span>
              <span className="text-sm font-bold text-slate-900">{todayLogs.length}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-2xl">
              <span className="text-xs font-semibold text-slate-500">Top category</span>
              <span className="text-xs font-bold text-slate-700 truncate ml-2 max-w-[90px] text-right">{topCategory}</span>
            </div>
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-amber-100"
              style={{ background: 'rgba(244,196,48,0.08)' }}
            >
              <span className="text-xs font-semibold text-amber-600">🔥 Streak</span>
              <span className="text-sm font-bold text-amber-600">{streakDays}d</span>
            </div>
          </div>
        </div>

        {/* Time by Category */}
        <div className="lg:col-span-4 bg-white rounded-[26px] border border-black/15 shadow-sm p-6">
          <h2 className="text-[16px] font-semibold text-slate-900">
            Time by category
          </h2>

          <div className="mt-6 h-[220px]">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No category data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
  {categoryBreakdown.slice(0, 4).map((c, idx) => (
    <div
      key={c.name}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 bg-white shadow-sm"
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: pieColors[idx % pieColors.length] }}
      />
      <p className="font-semibold text-slate-800">{c.name}</p>
    </div>
  ))}
</div>

        </div>

        {/* Recent Work */}
        <div className="lg:col-span-8 bg-white rounded-[26px] border border-black/15 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-slate-900">
              Recent work
            </h2>

            <Link
              to="/logs"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="py-4 flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {log.title}
                  </p>
                  <p className="text-xs text-slate-500">{log.category}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-6 text-xs text-slate-500 font-semibold flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    {log.timeSpent}m
                  </div>

                  <div className="hidden sm:block">
                    {new Date(log.createdAt).toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>
            ))}

            {recentLogs.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm font-medium">
                No logs yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
