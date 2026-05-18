import React from 'react';

export function StatusBadge({ status }) {
  const configs = {
    OPEN: { label: 'Backlog', style: 'text-blue-400 bg-blue-500/5 border-blue-500/10' },
    IN_PROGRESS: { label: 'Active', style: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
    DONE: { label: 'Resolved', style: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
  };

  const config = configs[status] || configs.OPEN;

  return (
    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${config.style}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const configs = {
    LOW: { label: 'Low', dot: 'bg-zinc-500' },
    MEDIUM: { label: 'Medium', dot: 'bg-amber-500' },
    HIGH: { label: 'High', dot: 'bg-rose-500' },
  };

  const config = configs[priority] || configs.LOW;

  return (
    <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-900 rounded-md border border-white/5">
      <div className={`w-1 h-1 rounded-full ${config.dot}`} />
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{config.label}</span>
    </div>
  );
}