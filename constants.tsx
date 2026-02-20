import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'logs', label: 'Logs', icon: BookOpen, path: '/logs' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const STATUS_COLORS = {
  Done: 'text-emerald-700 bg-emerald-50/70 border border-emerald-100',
  'In Progress': 'text-sky-700 bg-sky-50/70 border border-sky-100',
  Blocked: 'text-rose-700 bg-rose-50/70 border border-rose-100',
};

export const CATEGORY_COLORS = {
  Design: 'bg-violet-50/80 text-violet-700 border border-violet-100',
  Outreach: 'bg-amber-50/80 text-amber-700 border border-amber-100',
  Meetings: 'bg-sky-50/80 text-sky-700 border border-sky-100',
  Research: 'bg-indigo-50/80 text-indigo-700 border border-indigo-100',
  Ops: 'bg-emerald-50/80 text-emerald-700 border border-emerald-100',
  Admin: 'bg-slate-50/80 text-slate-700 border border-slate-200',
  Other: 'bg-slate-50/80 text-slate-700 border border-slate-200',
};
