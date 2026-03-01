
export enum Category {
  DESIGN = 'Design',
  OUTREACH = 'Outreach',
  MEETINGS = 'Meetings',
  RESEARCH = 'Research',
  OPS = 'Ops',
  ADMIN = 'Admin'
}

export enum Status {
  DONE = 'Done',
  IN_PROGRESS = 'In Progress',
  BLOCKED = 'Blocked'
}

export interface WorkLog {
  id: string;
  userId: string;
  title: string;
  impact: string;
  category: Category;
  status: Status;
  timeSpent: number; // minutes
  tags: string[];
  proofUrl?: string;
  links: string[];
  projectId: string;
  createdAt: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
}

export interface ProjectBoard {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  accentColor: string;
  reminderTime: string;
}

export type ThemeAccent = 'blue' | 'purple' | 'green' | 'orange';

export const ACCENT_COLORS: Record<ThemeAccent, string> = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b'
};
