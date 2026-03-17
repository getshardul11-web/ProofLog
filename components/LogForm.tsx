import { supabase } from '../services/supabase';
import React, { useState, useEffect } from 'react';
import { Category, Status } from '../types';
import { getAllCategories } from '../services/categories';
import { X, Tag, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface Board {
  id: string;
  name: string;
  position: number;
}

interface LogFormProps {
  onClose: () => void;
  onSaved: () => void;
}

const slugifyBoard = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-');

const extractBoardSlug = (project: Project) => {
  const desc = project.description || '';
  const match = desc.match(/\[board:(.*?)\]/);
  return match?.[1] || null;
};

const LogForm: React.FC<LogFormProps> = ({ onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([Category.DESIGN]);
  const [status, setStatus] = useState<Status>(Status.DONE);
  const [timeSpent, setTimeSpent] = useState<number>(30);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [links, setLinks] = useState<string>('');
  const [approach, setApproach] = useState('');
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [allCategories, setAllCategories] = useState<string[]>(Object.values(Category));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const savedBoards = localStorage.getItem(`prooflog-boards-${user.id}`);
        let boardsToUse: Board[] = [];
        if (savedBoards) {
          try {
            const parsed = JSON.parse(savedBoards);
            if (Array.isArray(parsed)) {
              boardsToUse = parsed.sort((a: Board, b: Board) => a.position - b.position);
            }
          } catch {}
        }

        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name, description, color')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!mounted) return;

        setBoards(boardsToUse);
        setProjects(projectsData || []);
        setAllCategories(getAllCategories(user.id));
      } catch (err) {
        console.error('Error loading projects for LogForm:', err);
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      alert('Please select at least one category.');
      return;
    }
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build tags: user tags + extra project IDs + metadata
      const userTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const primaryProjectId = selectedProjectIds[0] || null;
      const extraProjectIds = selectedProjectIds.slice(1);
      const pidTags = extraProjectIds.map(id => `_pid:${id}`);

      // Pack extra context into _meta tag
      const metaObj: Record<string, string> = {};
      if (approach.trim()) metaObj.approach = approach.trim();
      const metaTags = Object.keys(metaObj).length > 0
        ? [`_meta:${JSON.stringify(metaObj)}`]
        : [];

      const allTags = [...userTags, ...pidTags, ...metaTags];

      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        title,
        impact,
        category: selectedCategories.join(','),
        status,
        time_spent: timeSpent,
        project_id: primaryProjectId,
        tags: allTags,
        links: links.split('\n').map(l => l.trim()).filter(Boolean),
      });

      if (error) {
        alert('Failed to save log: ' + error.message);
        return;
      }

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Group projects by board
  const boardGroups = boards
    .map(board => ({
      board,
      projects: projects.filter(p => extractBoardSlug(p) === slugifyBoard(board.name)),
    }))
    .filter(g => g.projects.length > 0);

  const unassigned = projects.filter(p => {
    const slug = extractBoardSlug(p);
    if (!slug) return true;
    return !boards.some(b => slugifyBoard(b.name) === slug);
  });

  const inputCls = 'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400';
  const labelCls = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ animation: 'logFormIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes logFormIn {
            from { opacity: 0; transform: scale(0.95) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Work Log</h2>
            <p className="text-sm text-slate-400 mt-0.5">Capture what you just shipped</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className={labelCls}>What did you work on?</label>
            <input
              required
              autoFocus
              type="text"
              placeholder="e.g. Redesigned the checkout flow"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Impact */}
          <div>
            <label className={labelCls}>Impact Statement</label>
            <textarea
              required
              placeholder="Why does this matter? What changed as a result?"
              className={`${inputCls} h-20 resize-none`}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </div>

          {/* Approach */}
          <div>
            <label className={labelCls}>How did you do it?</label>
            <textarea
              placeholder='Tools, steps, or method you used — e.g. "Wireframed in Figma, iterated on 3 layouts, picked option B based on scroll depth data"'
              className={`${inputCls} h-20 resize-none`}
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div>
            <label className={labelCls}>
              Categories{' '}
              {selectedCategories.length > 0 && (
                <span className="text-amber-500 normal-case font-semibold">({selectedCategories.length} selected)</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => {
                const selected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none text-sm font-medium text-slate-700 cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {Object.values(Status).map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Time Spent (min)</label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none text-sm font-medium text-slate-700"
                value={timeSpent}
                onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Projects multi-select */}
          <div>
            <label className={labelCls}>
              Projects{' '}
              {selectedProjectIds.length > 0 && (
                <span className="text-amber-500 normal-case font-semibold">({selectedProjectIds.length} selected)</span>
              )}
            </label>
            {loadingProjects ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No projects yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                {boardGroups.map(({ board, projects: bProjects }) => (
                  <div key={board.id}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">{board.name}</p>
                    {bProjects.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(p.id)}
                          onChange={() => toggleProject(p.id)}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {unassigned.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">Other</p>
                    {unassigned.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(p.id)}
                          onChange={() => toggleProject(p.id)}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="design, ux, critical"
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none text-sm text-slate-700"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Links */}
          <div>
            <label className={labelCls}>Proof Links (one per line)</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                placeholder="https://figma.com/..."
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none h-16 resize-none text-sm text-slate-700"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Save Work Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogForm;
