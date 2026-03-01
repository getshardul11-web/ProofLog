import { WorkLog, Project, UserProfile } from '../types';
import { supabase } from './supabase';

export const db = {
  // =========================
  // USER
  // =========================
  async getUser(): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // fetch profile row
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('getUser profile error', error);
      return null;
    }

    return {
      id: user.id,
      name: data?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      photoUrl: data?.avatar_url || '',
      accentColor: data?.accent_color || 'blue',
      reminderTime: data?.reminder_time || '17:00',
    };
  },

  async updateUser(user: Partial<UserProfile>) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    const { error } = await supabase.from('profiles').upsert({
      id: authUser.id,
      name: user.name,
      avatar_url: user.photoUrl,
      accent_color: user.accentColor,
      reminder_time: user.reminderTime,
    });

    if (error) console.error('updateUser error', error);
  },

  // =========================
  // PROJECTS
  // =========================
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getProjects error', error);
      return [];
    }

    return data || [];
  },

  async saveProject(project: Project) {
    const { error } = await supabase.from('projects').upsert(project);

    if (error) console.error('saveProject error', error);
  },

  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) console.error('deleteProject error', error);
  },

  // =========================
  // LOGS
  // =========================
  async getLogs(): Promise<WorkLog[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getLogs error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
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
        : (row.createdAt || Date.now()),
    }));
  },

  async saveLog(log: WorkLog) {
    const { error } = await supabase.from('logs').insert(log);

    if (error) console.error('saveLog error', error);
  },

  async updateLog(id: string, updates: Partial<WorkLog>) {
    const { error } = await supabase
      .from('logs')
      .update(updates)
      .eq('id', id);

    if (error) console.error('updateLog error', error);
  },

  async deleteLog(id: string) {
    const { error } = await supabase.from('logs').delete().eq('id', id);

    if (error) console.error('deleteLog error', error);
  },

  async getLogById(id: string): Promise<WorkLog | null> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // =========================
  // DEV RESET (optional)
  // =========================
  clearAll: async () => {
    console.warn('clearAll is disabled in Supabase mode');
  },
};