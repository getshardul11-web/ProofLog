import { supabase } from '../services/supabase';
import React, { useState, useEffect, useMemo } from 'react';
import { Project } from '../types';
import {
  Plus,
  Folder,
  Clock,
  CheckCircle,
  Pencil,
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
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
  const [boards, setBoards] = useState<string[]>(DEFAULT_BOARDS);

  const [isAdding, setIsAdding] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBoard, setNewBoard] = useState(DEFAULT_BOARDS[0]);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBoard, setEditBoard] = useState(DEFAULT_BOARDS[0]);

  const accentColor = '#F4C430';

  /* =========================
     Load data
  ========================= */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: logsData } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id);

      if (!mounted) return;

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     Group projects
  ========================= */

  const projectsByBoard = useMemo(() => {
    const grouped: Record<string, Project[]> = {};

    boards.forEach((b) => (grouped[b] = []));

    projects.forEach((p) => {
      const slug = extractBoardSlug(p);
      const board =
        boards.find((b) => slugifyBoard(b) === slug) || boards[0];

      grouped[board].push(p);
    });

    return grouped;
  }, [projects, boards]);

  /* =========================
     Board actions
  ========================= */

  const addBoard = () => {
    if (!newBoardName.trim()) return;
    setBoards((prev) => [...prev, newBoardName.trim()]);
    setNewBoardName('');
  };

  const deleteBoard = (name: string) => {
    if (boards.length <= 1) return;
    setBoards((prev) => prev.filter((b) => b !== name));
  };

  const moveBoard = (name: string, dir: 'left' | 'right') => {
    const index = boards.indexOf(name);
    if (index === -1) return;

    const swap = dir === 'left' ? index - 1 : index + 1;
    if (swap < 0 || swap >= boards.length) return;

    const copy = [...boards];
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
    setBoards(copy);
  };

  const renameBoard = (oldName: string, newName: string) => {
    if (!newName.trim()) return;

    setBoards((prev) =>
      prev.map((b) => (b === oldName ? newName.trim() : b))
    );
  };

  /* =========================
     Project CRUD
  ========================= */

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        description: injectBoardMarker(newDesc, newBoard),
        color: randomColor(),
      })
      .select()
      .single();

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
    const board =
      boards.find((b) => slugifyBoard(b) === slug) || boards[0];

    setEditBoard(board);
    setIsEditingProject(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    await supabase
      .from('projects')
      .update({
        name: editName.trim(),
        description: injectBoardMarker(editDesc, editBoard),
      })
      .eq('id', editingProject.id);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProject.id
          ? {
            ...p,
            name: editName.trim(),
            description: injectBoardMarker(editDesc, editBoard),
          }
          : p
      )
    );

    setIsEditingProject(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
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
            className="px-4 py-2 border rounded-xl text-sm"
          />
          <button
            onClick={addBoard}
            className="px-4 py-2 rounded-xl border"
          >
            Add board
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border bg-white shadow-sm"
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
            key={board}
            className="bg-white rounded-3xl border shadow-sm flex flex-col"
          >
            {/* HEADER */}
            <div className="px-6 py-4 border-b flex items-center justify-between gap-2">
              <input
                defaultValue={board}
                onBlur={(e) => renameBoard(board, e.target.value)}
                className="font-semibold bg-transparent outline-none"
              />

              <div className="flex gap-2">
                <button onClick={() => moveBoard(board, 'left')}>
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => moveBoard(board, 'right')}>
                  <ArrowDown size={16} />
                </button>
                <button onClick={() => deleteBoard(board)}>
                  <Trash2 size={16} className="text-rose-500" />
                </button>
              </div>
            </div>

            {/* PROJECT LIST */}
            <div className="p-4 space-y-4">
              {(projectsByBoard[board] || []).map((project) => {
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
                    className="bg-white p-4 rounded-2xl border"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-xs text-slate-500">
                          {cleanDescription(project.description || '')}
                        </p>
                      </div>

                      <button onClick={() => openEditModal(project)}>
                        <Pencil size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between mt-3 text-xs">
                      <span>{projectLogs.length} logs</span>
                      <span>{Math.round(totalTime / 60)}h</span>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="mt-2 text-rose-500 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-[720px] bg-white rounded-[34px] border border-black/15 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-black/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create new project
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Give your project a name, board, and optional description.
                </p>
              </div>

              <button
                onClick={() => setIsAdding(false)}
                className="w-10 h-10 rounded-xl border border-black/10 bg-white flex items-center justify-center"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Eg. Website Revamp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Board
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-semibold text-slate-700 cursor-pointer"
                    value={newBoard}
                    onChange={(e) => setNewBoard(e.target.value)}
                  >
                    {boards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this project about?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-3 rounded-2xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl font-semibold text-slate-900 border border-black/10 bg-white shadow-sm hover:shadow-md transition-all"
                >
                  Create project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditingProject && editingProject && (
        <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-[720px] bg-white rounded-[34px] border border-black/15 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-black/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit project
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Update the project details or move it to another board.
                </p>
              </div>

              <button
                onClick={() => setIsEditingProject(false)}
                className="w-10 h-10 rounded-xl border border-black/10 bg-white flex items-center justify-center"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Board
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-semibold text-slate-700 cursor-pointer"
                    value={editBoard}
                    onChange={(e) => setEditBoard(e.target.value)}
                  >
                    {boards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none text-sm font-medium text-slate-800"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="px-5 py-3 rounded-2xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl font-semibold text-slate-900 border border-black/10 bg-white shadow-sm hover:shadow-md transition-all"
                >
                  Save changes
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