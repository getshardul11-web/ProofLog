import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { supabase } from '../services/supabase';
import { ACCENT_COLORS, UserProfile } from '../types';
import { Bell, CheckCircle2, BellOff, Check } from 'lucide-react';

const DAYS = [
  { label: 'M', full: 'Monday',    value: 1 },
  { label: 'T', full: 'Tuesday',   value: 2 },
  { label: 'W', full: 'Wednesday', value: 3 },
  { label: 'T', full: 'Thursday',  value: 4 },
  { label: 'F', full: 'Friday',    value: 5 },
  { label: 'S', full: 'Saturday',  value: 6 },
  { label: 'S', full: 'Sunday',    value: 0 },
];

const INTERVALS = [
  { label: 'Every 30 min',  value: 30  },
  { label: 'Every 1 hour',  value: 60  },
  { label: 'Every 2 hours', value: 120 },
  { label: 'Every 3 hours', value: 180 },
  { label: 'Every 4 hours', value: 240 },
];

interface ReminderConfig {
  enabled: boolean;
  days: number[];
  intervalMinutes: number;
  startHour: number;
  endHour: number;
  lastFired: number;
}

const defaultReminder: ReminderConfig = {
  enabled: false,
  days: [1, 2, 3, 4, 5],
  intervalMinutes: 120,
  startHour: 9,
  endHour: 18,
  lastFired: 0,
};

const Settings: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [reminder, setReminder] = useState<ReminderConfig>(defaultReminder);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [reminderSaved, setReminderSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const u = await db.getUser();
      if (!mounted) return;
      if (u) setUser(u);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted || !authUser) return;
      setUserId(authUser.id);

      // Load reminder config
      const raw = localStorage.getItem(`pollen-reminder-${authUser.id}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (mounted) setReminder({ ...defaultReminder, ...parsed });
        } catch {}
      }

      // Check notification permission
      if ('Notification' in window) {
        setNotifPermission(Notification.permission);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-medium">
        Loading settings…
      </div>
    );
  }

  const accentColor = ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430';

  const handleUpdate = (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    db.updateUser(updatedUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveReminder = (newConfig: ReminderConfig) => {
    setReminder(newConfig);
    if (userId) {
      localStorage.setItem(`pollen-reminder-${userId}`, JSON.stringify(newConfig));
    }
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2000);
  };

  const toggleDay = (day: number) => {
    const days = reminder.days.includes(day)
      ? reminder.days.filter(d => d !== day)
      : [...reminder.days, day];
    saveReminder({ ...reminder, days });
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      saveReminder({ ...reminder, enabled: true });
      // Send a welcome notification
      new Notification('Pollen reminders enabled 🌸', {
        body: "You'll get nudged to log your work on schedule.",
        icon: '/favicon.svg',
      });
    }
  };

  const sendTestNotification = () => {
    if (notifPermission !== 'granted') return;
    new Notification('Time to log your work! 🌸', {
      body: 'Keep your streak going — what did you just work on?',
      icon: '/favicon.svg',
    });
  };

  const permissionLabel = {
    granted: 'Enabled',
    denied: 'Blocked by browser',
    default: 'Not yet enabled',
  }[notifPermission];

  const permissionColor = {
    granted: 'text-emerald-600',
    denied: 'text-rose-500',
    default: 'text-amber-600',
  }[notifPermission];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <header>
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Manage your profile and notification preferences.</p>
      </header>

      {/* Save indicator */}
      {saved && (
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl w-fit">
          <Check size={15} />
          Saved
        </div>
      )}

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-center text-lg"
              style={{ background: `radial-gradient(circle at 30% 30%, ${accentColor} 0%, rgba(255,255,255,0.9) 70%)` }}
            >
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{user.name}</h3>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/70 bg-white/70 outline-none text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                value={user.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/70 bg-white/70 outline-none text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                value={user.email}
                onChange={(e) => handleUpdate({ email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200/70 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/70 border border-slate-200/70 shadow-sm flex items-center justify-center">
                <Bell size={17} className="text-slate-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Smart Reminders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Get nudged to log your work on schedule</p>
              </div>
            </div>

            {/* Permission status + action */}
            {notifPermission === 'granted' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={14} />
                  {permissionLabel}
                </span>
                <button
                  onClick={sendTestNotification}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
                >
                  Test
                </button>
              </div>
            ) : (
              <button
                onClick={requestPermission}
                disabled={notifPermission === 'denied'}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: notifPermission === 'denied' ? '#94a3b8' : accentColor }}
              >
                {notifPermission === 'denied' ? (
                  <><BellOff size={14} /> Blocked</>
                ) : (
                  <><Bell size={14} /> Enable</>
                )}
              </button>
            )}
          </div>

          {notifPermission === 'denied' && (
            <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
              Notifications are blocked by your browser. Open browser settings → Site settings → Notifications to allow Pollen.
            </div>
          )}

          {/* Enable toggle */}
          {notifPermission === 'granted' && (
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">Reminders active</p>
                <p className="text-xs text-slate-400 mt-0.5">Turn off to pause all reminders</p>
              </div>
              <button
                onClick={() => saveReminder({ ...reminder, enabled: !reminder.enabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${reminder.enabled ? 'bg-amber-400' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${reminder.enabled ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>
          )}

          {/* Days of Week */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => {
                const active = reminder.days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    title={day.full}
                    onClick={() => toggleDay(day.value)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'text-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-amber-300'
                    }`}
                    style={active ? { background: accentColor, border: `1.5px solid ${accentColor}` } : {}}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Remind me</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/70 bg-white/70 outline-none text-sm font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-amber-400 transition-all"
                value={reminder.intervalMinutes}
                onChange={e => saveReminder({ ...reminder, intervalMinutes: parseInt(e.target.value) })}
              >
                {INTERVALS.map(iv => (
                  <option key={iv.value} value={iv.value}>{iv.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Working hours</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0" max="23"
                  className="w-full px-3 py-3 rounded-2xl border border-slate-200/70 bg-white/70 outline-none text-sm font-semibold text-slate-700 text-center focus:ring-2 focus:ring-amber-400 transition-all"
                  value={reminder.startHour}
                  onChange={e => saveReminder({ ...reminder, startHour: parseInt(e.target.value) || 0 })}
                />
                <span className="text-slate-400 font-bold text-sm flex-shrink-0">→</span>
                <input
                  type="number"
                  min="0" max="23"
                  className="w-full px-3 py-3 rounded-2xl border border-slate-200/70 bg-white/70 outline-none text-sm font-semibold text-slate-700 text-center focus:ring-2 focus:ring-amber-400 transition-all"
                  value={reminder.endHour}
                  onChange={e => saveReminder({ ...reminder, endHour: parseInt(e.target.value) || 18 })}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-center">Hours (0–23 format)</p>
            </div>
          </div>

          {reminderSaved && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <Check size={13} />
              Reminder settings saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
