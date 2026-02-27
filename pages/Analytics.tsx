import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storage';
import { ACCENT_COLORS, Category, WorkLog } from '../types';
import { Clock, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, accentColor }: any) => (
  <div className="bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/70 border border-slate-200/70 shadow-sm flex items-center justify-center">
        <Icon size={20} style={{ color: accentColor }} />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-slate-500 tracking-tight">
          {label}
        </p>
        <p className="text-[20px] font-semibold tracking-tight text-slate-900 mt-1">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
        )}
      </div>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [accentColor, setAccentColor] = useState('#F4C430');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const user = await db.getUser();
      if (!mounted) return;
      if (user) {
        setAccentColor(ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430');
      }

      const logsData = await db.getLogs();
      if (!mounted) return;
      setLogs(logsData || []);
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalTime = logs.reduce((acc, l) => acc + l.timeSpent, 0);
  const totalHours = Math.floor(totalTime / 60);
  const totalMins = totalTime % 60;

  // Softer Pollen-style palette
  const COLORS = [
    '#f59e0b',
    '#0ea5e9',
    '#10b981',
    '#8b5cf6',
    '#f97316',
    '#ef4444',
    '#64748b',
  ];

  // Category distribution (by time)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(Category).forEach((cat) => (counts[cat] = 0));

    logs.forEach((log) => {
      counts[log.category] = (counts[log.category] || 0) + log.timeSpent;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const topCategory = categoryData.length > 0 ? categoryData[0].name : '—';

  // Logs per Day (last 7 days)
  const dailyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day) => ({ day, count: 0, time: 0 }));

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    logs
      .filter((l) => l.createdAt > weekAgo)
      .forEach((log) => {
        const dayIdx = new Date(log.createdAt).getDay();
        data[dayIdx].count += 1;
        data[dayIdx].time += log.timeSpent;
      });

    const todayIdx = new Date().getDay();
    return [...data.slice(todayIdx + 1), ...data.slice(0, todayIdx + 1)];
  }, [logs]);

  const totalWeekLogs = dailyData.reduce((acc, d) => acc + d.count, 0);
  const totalWeekTime = dailyData.reduce((acc, d) => acc + d.time, 0);
  const weekHours = Math.floor(totalWeekTime / 60);
  const weekMins = totalWeekTime % 60;

  return (
    <div className="space-y-10">





      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BarChart3}
          label="Total logs"
          value={logs.length}
          sub="all time"
          accentColor={accentColor}
        />
        <StatCard
          icon={Clock}
          label="Total time"
          value={`${totalHours}h ${totalMins}m`}
          sub="logged"
          accentColor={accentColor}
        />
        <StatCard
          icon={TrendingUp}
          label="This week"
          value={`${weekHours}h ${weekMins}m`}
          sub={`${totalWeekLogs} logs`}
          accentColor={accentColor}
        />
        <StatCard
          icon={PieIcon}
          label="Top category"
          value={topCategory}
          sub="most time spent"
          accentColor={accentColor}
        />
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Pie */}
        <div className="bg-white/60 backdrop-blur-2xl p-7 rounded-3xl border border-slate-200/70 shadow-sm">
          <h3 className="text-[16px] font-semibold tracking-tight text-slate-900 mb-2">
            Time by category
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Distribution of time spent (minutes).
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid rgba(226,232,240,0.8)',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-xs text-slate-600 font-semibold tracking-tight">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Logging */}
        <div className="bg-white/60 backdrop-blur-2xl p-7 rounded-3xl border border-slate-200/70 shadow-sm">
          <h3 className="text-[16px] font-semibold tracking-tight text-slate-900 mb-2">
            Daily logging activity
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Logs recorded each day (last 7 days).
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(226,232,240,0.8)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                />

                <Tooltip
                  cursor={{ fill: 'rgba(248,250,252,0.8)' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid rgba(226,232,240,0.8)',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                />

                <Bar
                  dataKey="count"
                  fill={accentColor}
                  radius={[12, 12, 12, 12]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Area */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-2xl p-7 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden">
          {/* Warm orb glow */}
          <div
            className="absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,165,0,0.85) 0%, rgba(255,220,120,0.55) 40%, rgba(255,255,255,0) 70%)',
            }}
          />

          <div className="relative z-10">
            <h3 className="text-[16px] font-semibold tracking-tight text-slate-900 mb-2">
              Effort trend
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Minutes spent each day (last 7 days).
            </p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="pollenTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(226,232,240,0.8)"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid rgba(226,232,240,0.8)',
                      backgroundColor: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="time"
                    stroke={accentColor}
                    fillOpacity={1}
                    fill="url(#pollenTime)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
