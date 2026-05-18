import React, { useState } from 'react';

/**
 * DESIGNER NOTE: 
 * This form uses high-contrast borders and specific focus-ring states 
 * to match the "Linear" aesthetic.
 */
export default function TaskForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Construct the task object for the hook
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority: priority
    });
    
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3 ml-1">
            Objective Heading
          </label>
          <input 
            autoFocus
            required
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder:text-zinc-700 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300"
            placeholder="e.g., Refactor Auth Middleware"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3 ml-1">
            Context Details
          </label>
          <textarea 
            rows="3"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder:text-zinc-700 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 resize-none"
            placeholder="Add technical context or requirements..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Priority Selector */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3 ml-1">
            Priority Level
          </label>
          <div className="flex gap-2">
            {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 ${
                  priority === p 
                    ? 'bg-white/10 border-white/20 text-white shadow-inner' 
                    : 'bg-transparent border-white/5 text-zinc-600 hover:border-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button 
          type="submit" 
          disabled={!title.trim()}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] uppercase tracking-tighter"
        >
          Initialize Cycle
        </button>
        <button 
          type="button" 
          onClick={onClose} 
          className="px-6 text-xs font-bold text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}