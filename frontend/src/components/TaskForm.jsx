import React, { useState } from 'react';

export default function TaskForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority: priority
      });
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">
            Task Heading
          </label>
          <input 
            autoFocus
            required
            disabled={isSubmitting}
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-zinc-700 focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
            placeholder="What needs to be done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">
            Description
          </label>
          <textarea 
            rows="3"
            disabled={isSubmitting}
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-zinc-700 focus:border-indigo-500/50 outline-none transition-all resize-none disabled:opacity-50"
            placeholder="Optional context..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3 px-1">
            Priority Level
          </label>
          <div className="flex gap-2">
            {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
              <button
                key={p}
                type="button"
                disabled={isSubmitting}
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  priority === p 
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' 
                    : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:border-white/10'
                } disabled:opacity-30`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-4">
        <button 
          type="submit" 
          disabled={!title.trim() || isSubmitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[11px] font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] uppercase flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Syncing...' : 'Initialize Task'}
        </button>
        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={onClose} 
          className="px-4 text-[11px] font-bold text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-tight"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}