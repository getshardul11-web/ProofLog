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

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);


  const accentColor = '#F4C430';

  useEffect(() => {
  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // fetch logs
    const { data: logsData } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setProjects(projectsData || []);
    setLogs(logsData || []);
  };

  loadData();
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

  const StatCard = ({
  label,
  value,
  subValue,
  icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
}) => (
  <div className="bg-white px-6 py-5 rounded-[22px] border border-black/15 shadow-sm h-[92px] flex items-center gap-5">
    
    {/* BIG ICON BLOCK */}
    <div
  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-sm"
  style={{
    background: iconBg,
    border: `1.5px solid ${accentColor}`,

  }}
>
  {icon}
</div>


    {/* CONTENT */}
    <div className="flex flex-col justify-center leading-tight">
      <p className="text-[12px] font-bold text-slate-900">{label}</p>

      <div className="mt-1 flex items-baseline gap-2">
        <h3 className="text-[22px] font-semibold tracking-tight text-slate-600">
          {value}
        </h3>

        {subValue && (
          <span className="text-xs text-slate-400 font-medium">{subValue}</span>
        )}
      </div>
    </div>
  </div>
);


  return (
    <div className="w-full space-y-6">
      {/* HERO ROW */}
      <div className="flex items-start justify-between gap-10">
        <div>
          <h1
            className="text-[38px] font-semibold tracking-tight"
            style={{ color: accentColor }}
          >
            Welcome to Pollen.
          </h1>
        </div>

        <div className="flex-1 flex justify-end">
          <p className="text-[20px] text-slate-900 font-semibold max-w-[460px] text-right leading-relaxed mt-4">
            A high agency system for high agency builders.
          </p>
        </div>
      </div>

      {/* TOP STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-5">
  <StatCard
    label="Today"
    value={`${totalHoursToday}h ${totalMinsToday}m`}
    subValue={`${todayLogs.length} logs`}
    icon={<Timer size={22} className="text-black" />}
    iconBg="white"
  />

  <StatCard
    label="This week"
    value={`${totalHoursWeek}h ${totalMinsWeek}m`}
    subValue={`${weekLogs.length} logs`}
    icon={<CalendarDays size={22} className="text-black" />}
    iconBg="white"
  />

  <StatCard
    label="Completed"
    value={completedLogs}
    subValue="all time"
    icon={<CheckCircle2 size={22} className="text-black" />}
    iconBg="white"
  />

  <StatCard
    label="Projects"
    value={projects.length}
    subValue="active"
    icon={<FolderKanban size={22} className="text-black" />}
    iconBg="white"
  />

  <StatCard
    label="Streak"
    value={`${streakDays} days`}
    subValue="current"
    icon={<Flame size={22} className="text-black" />}
    iconBg="white"
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

          <div className="mt-6 space-y-4">
            {projects.slice(0, 4).map((project) => {
              const projectLogs = logs.filter((l) => l.projectId === project.id);
              const projectTime = projectLogs.reduce(
                (acc, l) => acc + l.timeSpent,
                0
              );

              return (
                <div key={project.id}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-semibold text-slate-800 text-sm">
                        {project.name}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      {Math.round(projectTime / 60)}h
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-black/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (projectTime / 600) * 100)}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
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
        <div className="lg:col-span-3 bg-white rounded-[26px] border border-black/15 shadow-sm p-6">
          <h2 className="text-[16px] font-semibold text-slate-900">
            Daily focus
          </h2>

          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Time logged</p>
              <p className="font-semibold text-slate-900">
                {totalHoursToday}h {totalMinsToday}m
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Logs captured</p>
              <p className="font-semibold text-slate-900">{todayLogs.length}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Top category</p>
              <p className="font-semibold text-slate-900">{topCategory}</p>
            </div>
          </div>

          <div className="mt-8 text-xs font-semibold text-slate-400">
            Keep compounding.
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
                className="py-4 flex items-start justify-between gap-6"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {log.title}
                  </p>
                  <p className="text-xs text-slate-500">{log.category}</p>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    {log.timeSpent}m
                  </div>

                  <div>
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
