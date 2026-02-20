import { WorkLog, Project, UserProfile, Category, Status } from '../types';

// LocalStorage Keys
const STORAGE_KEYS = {
  LOGS: 'prooflog_logs',
  PROJECTS: 'prooflog_projects',
  USER: 'prooflog_user',
};

const DEFAULT_USER: UserProfile = {
  id: 'user_1',
  name: 'Shardul G',
  email: 'sg.work004@gmail.com',
  photoUrl: 'https://i.ibb.co/jPwtXWcK/Profile-picture.png',
  accentColor: 'blue',
  reminderTime: '17:00',
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    userId: 'user_1',
    name: 'Brand Refresh',
    description: 'Overhaul of corporate identity',
    color: '#8b5cf6',
    createdAt: Date.now(),
  },
  {
    id: 'p2',
    userId: 'user_1',
    name: 'Customer Outreach',
    description: 'Q3 Sales campaign',
    color: '#f59e0b',
    createdAt: Date.now(),
  },
];

const INITIAL_LOGS: WorkLog[] = [
  {
    id: 'l1',
    userId: 'user_1',
    title: 'Logo Iteration v2',
    impact: 'Finalized the core brand symbol for stakeholders',
    category: Category.DESIGN,
    status: Status.DONE,
    timeSpent: 120,
    tags: ['branding', 'vector'],
    projectId: 'p1',
    links: [],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'l2',
    userId: 'user_1',
    title: 'Outreach Pipeline Research',
    impact: 'Identified 50 high-value leads for Q4',
    category: Category.RESEARCH,
    status: Status.IN_PROGRESS,
    timeSpent: 90,
    tags: ['sales', 'leads'],
    projectId: 'p2',
    links: ['https://notion.so/leads-database'],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'l3',
    userId: 'user_1',
    title: 'Weekly Sync with Product Team',
    impact: 'Resolved blockers for the UI migration',
    category: Category.MEETINGS,
    status: Status.DONE,
    timeSpent: 60,
    tags: ['sync', 'internal'],
    projectId: 'p1',
    links: [],
    createdAt: Date.now() - 3600000,
  },
];

// Utility: Ensure every log has a stable order value
const normalizeLogOrder = (logs: WorkLog[]) => {
  return logs
    .map((log, idx) => ({
      ...log,
      order: (log as any).order ?? idx,
    }))
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((log, idx) => ({
      ...log,
      order: idx,
    }));
};

export const db = {
  // -------------------------
  // LOGS
  // -------------------------
  getLogs: (): WorkLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);

    if (!data) {
      const normalized = normalizeLogOrder(INITIAL_LOGS);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(normalized));
      return normalized;
    }

    const parsed = JSON.parse(data) as WorkLog[];
    return normalizeLogOrder(parsed);
  },

  saveLogs: (logs: WorkLog[]) => {
    const normalized = normalizeLogOrder(logs);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(normalized));
  },

  saveLog: (log: WorkLog) => {
    const logs = db.getLogs();

    // Add newest log at top, but still assign order properly
    const updated = [
      { ...log, order: 0 },
      ...logs.map((l: any) => ({ ...l, order: (l.order ?? 0) + 1 })),
    ];

    db.saveLogs(updated);
  },

  getLogById: (id: string): WorkLog | null => {
    const logs = db.getLogs();
    return logs.find((l) => l.id === id) || null;
  },

  updateLog: (id: string, updates: Partial<WorkLog>) => {
    const logs = db.getLogs();

    const updatedLogs = logs.map((log: any) =>
      log.id === id ? { ...log, ...updates } : log
    );

    db.saveLogs(updatedLogs);
  },

  deleteLog: (id: string) => {
    const logs = db.getLogs();
    const updated = logs.filter((l) => l.id !== id);
    db.saveLogs(updated);
  },

  // -------------------------
  // PROJECTS
  // -------------------------
  getProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.PROJECTS,
        JSON.stringify(INITIAL_PROJECTS)
      );
      return INITIAL_PROJECTS;
    }

    return JSON.parse(data);
  },

  saveProject: (project: Project) => {
    const projects = db.getProjects();
    localStorage.setItem(
      STORAGE_KEYS.PROJECTS,
      JSON.stringify([...projects, project])
    );
  },

  // -------------------------
  // USER
  // -------------------------
  getUser: (): UserProfile => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);

    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }

    return JSON.parse(data);
  },

  updateUser: (user: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // -------------------------
  // RESET ALL (OPTIONAL)
  // -------------------------
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};
