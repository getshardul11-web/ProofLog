import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { ACCENT_COLORS, UserProfile } from '../types';
import { Palette, Bell, CheckCircle2, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const u = await db.getUser();
      if (!mounted) return;
      if (u) {
        setUser(u);
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return <div className="p-10 text-slate-500">Loading settings...</div>;
  }

  const accentColor =
    ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430';

  const handleUpdate = (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    db.updateUser(updatedUser);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (updates.accentColor) {
      document.documentElement.style.setProperty(
        '--accent-color',
        ACCENT_COLORS[updates.accentColor as keyof typeof ACCENT_COLORS]
      );
    }
  };

  const handleReset = () => {
    const ok = confirm(
      'Reset all Pollen data? This will delete all logs and projects. This cannot be undone.'
    );
    if (!ok) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-10 max-w-3xl">

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

      {/* Header */}
      <header>
        <h1 className="text-[34px] leading-tight font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-slate-500 mt-2 text-[15px] max-w-xl">
          Manage your profile, reminder preferences, and the look & feel of Pollen.
        </p>
      </header>

      <div className="space-y-7">
        {/* Profile */}
        <div className="bg-white/60 backdrop-blur-2xl p-7 rounded-3xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
            

              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border border-slate-200/70 shadow-sm"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${accentColor} 0%, rgba(255,255,255,0.9) 70%)`,
                }}
              />
            </div>

            <div>
              <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">
                {user.name}
              </h3>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl outline-none text-sm font-medium text-slate-800"
                value={user.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl outline-none text-sm font-medium text-slate-800"
                value={user.email}
                onChange={(e) => handleUpdate({ email: e.target.value })}
              />
            </div>

          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white/60 backdrop-blur-2xl p-7 rounded-3xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-white/70 border border-slate-200/70 shadow-sm flex items-center justify-center">
              <Bell size={18} className="text-slate-600" />
            </div>

            <div>
              <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                Reminder
              </h3>
              <p className="text-sm text-slate-500">
                Set a daily time to log your proof.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-5 bg-white/60 border border-slate-200/70 rounded-3xl">
            <div>
              <p className="font-semibold text-slate-900 text-sm tracking-tight">
                Daily log reminder
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Helps you stay consistent.
              </p>
            </div>

            <input
              type="time"
              className="px-4 py-2.5 rounded-2xl border border-slate-200/70 outline-none bg-white/70 backdrop-blur-xl text-sm font-semibold text-slate-700"
              value={user.reminderTime}
              onChange={(e) => handleUpdate({ reminderTime: e.target.value })}
            />
          </div>
        </div>


      </div>
    </div>
  );
};

export default Settings;
