import { supabase } from '../services/supabase';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectBoard } from '../types';
import {
  Plus,
  Folder,
  Clock,
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
} from 'lucide-react';

/* =========================
   Helpers
========================= */

const DEFAULT_BOARDS = [
  'YelloSKYE',
  'Enterprise',
  'Building Cool Stuff',
];

const PROJECT_COLORS = [
  '#f59e0b',
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

const randomColor = () =>
  PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

const slugifyBoard = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-');

const cleanDescription = (desc: string) =>
  (desc || '').replace(/\[board:.*?\]/g, '').trim();

const injectBoardMarker = (desc: string, boardName: string) => {
  const cleaned = cleanDescription(desc);
  const slug = slugifyBoard(boardName);
  return `${cleaned} [board:${slug}]`.trim();
};

const extractBoardSlug = (project: Project) => {
  const desc = project.description || '';
  const match = desc.match(/\[board:(.*?)\]/);
  return match?.[1] || null;
};

/* =========================
   Component
========================= */

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [boards, setBoards] = useState<ProjectBoard[]>([]);
  const userIdRef = useRef<string | null>(null);

  const saveBoards = (newBoards: ProjectBoard[]) => {
    setBoards(newBoards);
    if (userIdRef.current) {
      localStorage.setItem(
        `prooflog-boards-${userIdRef.current}`,
        JSON.stringify(newBoards)
      );
    }
  };

  const makeBoard = (name: string, position: number): ProjectBoard => ({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    user_id: userIdRef.current ?? '',
    name,
    position,
    created_at: new Date().toISOString(),
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBoard, setNewBoard] = useState(''); // Board NAME for select

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBoard, setEditBoard] = useState(''); // Board NAME for select

  const accentColor = '#F4C430';

  /* =========================
     Load data
  ========================= */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        userIdRef.current = user.id;

        // 1. Load Boards from localStorage
        const savedBoards = localStorage.getItem(`prooflog-boards-${user.id}`);
        let boardsToUse: ProjectBoard[] = [];

        if (savedBoards) {
          try {
            const parsed = JSON.parse(savedBoards);
            if (Array.isArray(parsed) && parsed.length > 0) {
              boardsToUse = parsed;
            }
          } catch {
            // ignore malformed data
          }
        }

        // Seed defaults if nothing saved
        if (boardsToUse.length === 0) {
          boardsToUse = DEFAULT_BOARDS.map((name, index) => ({
            id: `local-${Date.now()}-${index}`,
            user_id: user.id,
            name,
            position: index,
            created_at: new Date().toISOString(),
          }));
          localStorage.setItem(`prooflog-boards-${user.id}`, JSON.stringify(boardsToUse));
        }

        if (mounted) {
          setBoards(boardsToUse);
          if (boardsToUse[0]) {
            setNewBoard(boardsToUse[0].name);
            setEditBoard(boardsToUse[0].name);
          }
        }

        // 2. Load Projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) console.error('Error loading projects:', projectsError);

        // 3. Load Logs
        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .eq('user_id', user.id);

        if (logsError) console.error('Error loading logs:', logsError);

        if (mounted) {
          setProjects(Array.isArray(projectsData) ? projectsData : []);
          setLogs(Array.isArray(logsData) ? logsData : []);
        }
      } catch (err) {
        console.error('CRITICAL ERROR in loadData:', err);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  /* =========================
     Group projects
  ========================= */

  const projectsByBoard = useMemo(() => {
    const grouped: Record<string, Project[]> = {};
    boards.forEach((b) => (grouped[b.name] = []));

    projects.forEach((p) => {
      const slug = extractBoardSlug(p);
      const board = boards.find((b) => slugifyBoard(b.name) === slug) || boards[0];

      if (board && grouped[board.name]) {
        grouped[board.name].push(p);
      } else if (boards[0]) {
        grouped[boards[0].name].push(p);
      }
    });

    return grouped;
  }, [projects, boards]);

  /* =========================
     Board actions
  ========================= */

  const addBoard = () => {
    if (!newBoardName.trim()) return;
    const newBoardObj = makeBoard(newBoardName.trim(), boards.length);
    saveBoards([...boards, newBoardObj]);
    setNewBoardName('');
  };

  const deleteBoard = (board: ProjectBoard) => {
    if (boards.length <= 1) return;
    if (!window.confirm(`Delete board "${board.name}"? Projects will move to the first board.`)) return;
    saveBoards(boards.filter((b) => b.id !== board.id));
  };

  const moveBoard = (board: ProjectBoard, dir: 'left' | 'right') => {
    const index = boards.findIndex(b => b.id === board.id);
    if (index === -1) return;

    const swap = dir === 'left' ? index - 1 : index + 1;
    if (swap < 0 || swap >= boards.length) return;

    const newBoards = [...boards];
    [newBoards[index], newBoards[swap]] = [newBoards[swap], newBoards[index]];
    saveBoards(newBoards);
  };

  const renameBoard = async (board: ProjectBoard, newName: string) => {
    if (!newName.trim() || board.name === newName || !supabase) return;

    const oldSlug = slugifyBoard(board.name);
    const newSlug = slugifyBoard(newName.trim());

    saveBoards(boards.map((b) => (b.id === board.id ? { ...b, name: newName.trim() } : b)));

    // Update local projects
    setProjects(prev => prev.map(p =>
      extractBoardSlug(p) === oldSlug
        ? { ...p, description: p.description?.replace(`[board:${oldSlug}]`, `[board:${newSlug}]`) }
        : p
    ));

    // Update DB projects async
    const projectsToUpdate = projects.filter(p => extractBoardSlug(p) === oldSlug);
    for (const p of projectsToUpdate) {
      const updatedDesc = p.description?.replace(`[board:${oldSlug}]`, `[board:${newSlug}]`);
      await supabase.from('projects').update({ description: updatedDesc }).eq('id', p.id);
    }
  };

  /* =========================
     Project CRUD
  ========================= */

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in.');
      return;
    }

    const payload = {
      user_id: user.id,
      name: newName.trim(),
      description: injectBoardMarker(newDesc, newBoard),
      color: randomColor(),
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      alert('Failed to save project: ' + error.message);
      return;
    }

    if (data) setProjects((p) => [data, ...p]);
    setIsAdding(false);
    setNewName('');
    setNewDesc('');
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(cleanDescription(project.description || ''));
    const slug = extractBoardSlug(project);
    const board = boards.find((b) => slugifyBoard(b.name) === slug) || boards[0];
    setEditBoard(board?.name || '');
    setIsEditingProject(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !supabase) return;

    const payload = {
      name: editName.trim(),
      description: injectBoardMarker(editDesc, editBoard),
    };

    const { error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', editingProject.id);

    if (error) {
      alert('Failed to update project: ' + error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProject.id
          ? { ...p, ...payload }
          : p
      )
    );

    setIsEditingProject(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    if (!supabase) return;

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      alert('Failed to delete project: ' + error.message);
      return;
    }

    setProjects((p) => p.filter((x) => x.id !== id));
  };

  /* =========================
     Render
  ========================= */

  return (
    <div className="relative w-full space-y-8">
      {/* TOP BAR */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <p className="text-[20px] font-semibold text-slate-900 tracking-tight">
          Organize your work into projects
        </p>

        <div className="flex gap-3">
          <input
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="New board"
            className="px-4 py-2 border rounded-xl text-sm outline-none focus:border-yellow-400"
          />
          <button
            onClick={addBoard}
            className="px-4 py-2 rounded-xl border border-black/10 bg-white shadow-sm hover:shadow-md transition-all text-sm font-medium"
          >
            Add board
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border bg-white shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={18} style={{ color: accentColor }} />
            Add project
          </button>
        </div>
      </div>

      {/* BOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-white rounded-3xl border shadow-sm flex flex-col min-h-[400px]"
          >
            {/* HEADER */}
            <div className="px-6 py-4 border-b flex items-center justify-between gap-2">
              <input
                defaultValue={board.name}
                onBlur={(e) => renameBoard(board, e.target.value)}
                className="font-semibold bg-transparent outline-none flex-1 truncate"
              />

              <div className="flex gap-1 text-slate-300">
                <button onClick={() => moveBoard(board, 'left')} className="p-1 hover:text-slate-600 transition-colors">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => moveBoard(board, 'right')} className="p-1 hover:text-slate-600 transition-colors">
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => deleteBoard(board)} className="p-1 hover:text-rose-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* PROJECT LIST */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {(projectsByBoard[board.name] || []).map((project) => {
                const projectLogs = logs.filter(
                  (l: any) => l.project_id === project.id
                );

                const totalTime = projectLogs.reduce(
                  (acc, l) => acc + (l.timeSpent || 0),
                  0
                );

                return (
                  <div
                    key={project.id}
                    className="bg-white p-4 rounded-2xl border hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{project.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {cleanDescription(project.description || '') || 'No description'}
                        </p>
                      </div>

                      <button
                        onClick={() => openEditModal(project)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-slate-400"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between mt-3 text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Folder size={12} className="text-slate-300" /> {projectLogs.length} logs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-300" /> {Math.round(totalTime / 60)}h
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="mt-3 text-rose-500 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}

              {(!projectsByBoard[board.name] || projectsByBoard[board.name].length === 0) && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                  <Folder size={32} />
                  <p className="text-xs mt-2 font-medium">No projects</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  New Project
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Create a container for your work logs.
                </p>
              </div>

              <button
                onClick={() => setIsAdding(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Project name
                  </label>
                  <input
                    required
                    autoFocus
                    type="text"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Eg. Q1 Marketing Campaign"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Board
                  </label>
                  <select
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-700 cursor-pointer transition-all"
                    value={newBoard}
                    onChange={(e) => setNewBoard(e.target.value)}
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all resize-none"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief overview of goals..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg shadow-yellow-200 hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-tr from-yellow-400 to-amber-400"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditingProject && editingProject && (
        <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Edit Project
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Adjust project details and board assignment.
                </p>
              </div>

              <button
                onClick={() => setIsEditingProject(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Project name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Move to Board
                  </label>
                  <select
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-700 cursor-pointer transition-all"
                    value={editBoard}
                    onChange={(e) => setEditBoard(e.target.value)}
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all resize-none"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg shadow-yellow-200 hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-tr from-yellow-400 to-amber-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;