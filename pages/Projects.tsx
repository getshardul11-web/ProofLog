import { supabase } from '../services/supabase';
import React, { useState, useEffect, useMemo } from 'react';
import { Project, ACCENT_COLORS } from '../types';
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

type BoardType = 'YelloSKYE' | 'Enterprise' | 'Building Cool Stuff';

const BOARDS: BoardType[] = ['YelloSKYE', 'Enterprise', 'Building Cool Stuff'];
const [logs, setLogs] = useState<any[]>([]);
/** Random pleasing palette */
const PROJECT_COLORS = [
  '#f59e0b', // amber
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
];

const randomColor = () => {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
};

/** Clean description from board markers */
const cleanDescription = (desc: string) => {
  return (desc || '').replace(/\[board:.*?\]/g, '').trim();
};

/** Inject board marker */
const injectBoardMarker = (desc: string, board: BoardType) => {
  const cleaned = cleanDescription(desc);

  if (board === 'YelloSKYE') return `${cleaned} [board:yelloskye]`.trim();
  if (board === 'Enterprise') return `${cleaned} [board:enterprise]`.trim();
  if (board === 'Building Cool Stuff') return `${cleaned} [board:coolshit]`.trim();

  return cleaned;
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBoard, setNewBoard] = useState<BoardType>('YelloSKYE');

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBoard, setEditBoard] = useState<BoardType>('Enterprise');


  const accentColor = '#F4C430';



  useEffect(() => {
  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: logsData } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id);

    setProjects(projectsData || []);
    setLogs(logsData || []);
  };

  loadData();
}, []);

  /** Safe board extraction */
  const getBoardForProject = (project: Project): BoardType => {
    const desc = (project.description || '').toLowerCase();
    const name = project.name.toLowerCase();

    if (desc.includes('[board:yelloskye]') || name.includes('yelloskye'))
      return 'YelloSKYE';

    if (desc.includes('[board:enterprise]') || name.includes('enterprise'))
      return 'Enterprise';

    if (
      desc.includes('[board:coolshit]') ||
      name.includes('Building Cool Stuff') ||
      name.includes('cool')
    )
      return 'Building Cool Stuff';

    return 'Enterprise';
  };

  /** Group projects by board */
  const projectsByBoard = useMemo(() => {
    const grouped: Record<BoardType, Project[]> = {
      YelloSKYE: [],
      Enterprise: [],
      'Building Cool Stuff': [],
    };

    projects.forEach((p) => {
      grouped[getBoardForProject(p)].push(p);
    });

    return grouped;
  }, [projects]);

  /** Add Project */
const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const generatedColor = randomColor();

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
    color: generatedColor,
  })
  .select()
  .single();

if (data) {
  setProjects((prev) => [data, ...prev]);
}

    setIsAdding(false);
    setNewName('');
    setNewDesc('');
    setNewBoard('YelloSKYE');
  };

  /** Open Edit Modal */
  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(cleanDescription(project.description || ''));
    setEditBoard(getBoardForProject(project));
    setIsEditing(true);
  };

  /** Save Edit */
  const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingProject) return;

  const { error } = await supabase
    .from('projects')
    .update({
      name: editName.trim(),
      description: injectBoardMarker(editDesc, editBoard),
    })
    .eq('id', editingProject.id);

  if (error) {
    console.error('update project error', error);
    return;
  }

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

  setIsEditing(false);
  setEditingProject(null);
};

  /** Delete project */
  const handleDeleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('delete project error', error);
    return;
  }

  setProjects((prev) => prev.filter((p) => p.id !== projectId));
};
  /** Reorder inside same board */
  const moveProject = (
    board: BoardType,
    projectId: string,
    direction: 'up' | 'down'
  ) => {
    const boardProjects = projectsByBoard[board];
    const index = boardProjects.findIndex((p) => p.id === projectId);

    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= boardProjects.length) return;

    const reordered = [...boardProjects];
    const temp = reordered[index];
    reordered[index] = reordered[swapIndex];
    reordered[swapIndex] = temp;

    // rebuild global list preserving other boards order
    const newAll: Project[] = [];

    BOARDS.forEach((b) => {
      if (b === board) {
        newAll.push(...reordered);
      } else {
        newAll.push(...projectsByBoard[b]);
      }
    });

    setProjects(newAll);
  };

  return (
    <div className="relative w-full space-y-8">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[40px] right-[80px] w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.14] bg-yellow-200" />
        <div className="absolute top-[220px] left-[40px] w-[360px] h-[360px] rounded-full blur-3xl opacity-[0.12] bg-yellow-200" />
        <div className="absolute bottom-[120px] right-[60px] w-[520px] h-[520px] rounded-full blur-3xl opacity-[0.12] bg-yellow-200" />

        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.05]"
          viewBox="0 0 1800 950"
          fill="none"
        >
          <circle cx="200" cy="160" r="5" fill="#facc15" />
          <circle cx="460" cy="280" r="5" fill="#facc15" />
          <circle cx="720" cy="200" r="5" fill="#facc15" />
          <circle cx="1040" cy="260" r="5" fill="#facc15" />
          <circle cx="1440" cy="220" r="5" fill="#facc15" />

          <path
            d="M200 160 L460 280 L720 200 L1040 260 L1440 220"
            stroke="#facc15"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* HEADER BAR */}
      {/* TOP ACTION BAR */}
<div className="relative z-10 flex items-center justify-between mb-6">
  {/* Left text aligned to Raw Breakdown border */}
  <p className="text-[20px] font-semibold text-slate-900 tracking-tight">
    Organize your work into projects, so you can actually finish them :)
  </p>
      
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border border-black/15 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={18} style={{ color: accentColor }} />
          Add new project
        </button>
      </div>

      {/* BOARD GRID (fixed height so it NEVER goes below screen) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(98vh-260px)] overflow-hidden">
        {BOARDS.map((board) => (
          <div
            key={board}
            className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-black/10 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Board Header */}
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight text-slate-900">
                  {board}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {projectsByBoard[board].length} projects
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl border border-black/10 bg-white/70 shadow-sm flex items-center justify-center">
                <Folder size={18} className="text-slate-600" />
              </div>
            </div>

            {/* Internal scroll section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {projectsByBoard[board].map((project) => {
                const projectLogs = logs.filter((l: any) => l.project_id === project.id);
                const totalTime = projectLogs.reduce(
                  (acc, l) => acc + l.timeSpent,
                  0
                );

                return (
                  <div
                    key={project.id}
                    className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-black/10 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* auto icon */}
                        <div
                          className="w-11 h-11 rounded-2xl border border-black/10 shadow-sm flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle at top left, ${project.color} 0%, rgba(255,255,255,0.85) 75%)`,
                          }}
                        />

                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 truncate">
                            {project.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {cleanDescription(project.description || '') ||
                              'No description'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => openEditModal(project)}
                        className="w-9 h-9 rounded-xl border border-black/10 bg-white/70 shadow-sm flex items-center justify-center hover:bg-white transition"
                      >
                        <Pencil size={15} className="text-slate-500" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 rounded-full bg-white/70 border border-black/10">
                        <CheckCircle size={14} className="text-slate-400" />
                        {projectLogs.length} logs
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 rounded-full bg-white/70 border border-black/10">
                        <Clock size={14} className="text-slate-400" />
                        {Math.round(totalTime / 60)}h
                      </div>
                    </div>

                    {/* reorder + delete */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveProject(board, project.id, 'up')}
                          className="w-9 h-9 rounded-xl border border-black/10 bg-white/70 shadow-sm flex items-center justify-center hover:bg-white transition"
                        >
                          <ArrowUp size={16} className="text-slate-500" />
                        </button>

                        <button
                          onClick={() => moveProject(board, project.id, 'down')}
                          className="w-9 h-9 rounded-xl border border-black/10 bg-white/70 shadow-sm flex items-center justify-center hover:bg-white transition"
                        >
                          <ArrowDown size={16} className="text-slate-500" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="w-9 h-9 rounded-xl border border-black/10 bg-white/70 shadow-sm flex items-center justify-center hover:bg-white transition"
                      >
                        <Trash2 size={16} className="text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {projectsByBoard[board].length === 0 && (
                <div className="text-sm text-slate-500 px-4 py-10 text-center border border-dashed border-black/10 rounded-3xl bg-white/40">
                  No projects yet.
                </div>
              )}
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
                    onChange={(e) => setNewBoard(e.target.value as BoardType)}
                  >
                    {BOARDS.map((b) => (
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
      {isEditing && editingProject && (
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
                onClick={() => setIsEditing(false)}
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
                    onChange={(e) => setEditBoard(e.target.value as BoardType)}
                  >
                    {BOARDS.map((b) => (
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
                  onClick={() => setIsEditing(false)}
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
