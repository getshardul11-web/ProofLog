import { supabase } from '../services/supabase';
import React, { useState } from 'react';
import { Category, Status, WorkLog, Project } from '../types';
import { X, Tag, Link as LinkIcon, Image as ImageIcon, Plus } from 'lucide-react';

interface LogFormProps {
  onClose: () => void;
  onSaved: () => void;
  projects: Project[];
}

const LogForm: React.FC<LogFormProps> = ({ onClose, onSaved, projects }) => {
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState<Category>(Category.DESIGN);
  const [status, setStatus] = useState<Status>(Status.DONE);
  const [timeSpent, setTimeSpent] = useState<number>(30);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [tags, setTags] = useState<string>('');
  const [links, setLinks] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) return;

await supabase.from('logs').insert({
  user_id: user.id,
  title,
  impact,
  category,
  status,
  time_spent: timeSpent,
  project_id: projectId || null,
  tags: tags.split(',').map(t => t.trim()).filter(Boolean),
  links: links.split('\n').map(l => l.trim()).filter(Boolean),
});
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">New Work Log</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">What did you work on?</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Redesigned Checkout Flow"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Impact Statement</label>
            <textarea 
              required
              placeholder="Why does this matter? What changed?"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {Object.values(Status).map(stat => <option key={stat} value={stat}>{stat}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Time Spent (min)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={timeSpent}
                onChange={(e) => setTimeSpent(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">No Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="design, web, critical"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Links (one per line)</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea 
                placeholder="https://figma.com/..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-16 resize-none"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
              <Plus size={20} />
              Save Work Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogForm;
