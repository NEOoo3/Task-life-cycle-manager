import React, { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Board from './components/Board';
import TaskForm from './components/TaskForm';

/**
 * ARCHITECTURAL NOTE: 
 * Root orchestrator. Resolved clipping via padding normalization 
 * and integrated full CRUD (Delete) support.
 */
export default function App() {
  // 1. Added 'deleteTask' to sync with your TaskCard logic
  const { tasks, loading, error, addTask, moveTask, deleteTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. High-integrity submission handler to prevent modal glitching
  const handleCreateTask = async (taskData) => {
    try {
      await addTask(taskData);
      setIsModalOpen(false); // Close only on success
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. NAVIGATION */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                <span className="text-white font-black italic text-lg leading-none select-none">L</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold tracking-tight leading-none text-white">Lifecycle</span>
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mt-1">Workspace</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
            <div className="relative hidden md:block">
              <input 
                type="text"
                placeholder="Search engine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.05] rounded-full pl-10 pr-4 py-1.5 text-xs text-zinc-300 w-64 focus:w-80 focus:border-indigo-500/50 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-full transition-all active:scale-95 uppercase tracking-tighter"
            >
              + Create Entry
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN WORKSPACE */}
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Master Operations</h2>
            <p className="text-zinc-500 text-sm font-medium">Manage and transition operational lifecycles.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <div className="w-12 h-12 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Initializing Interface</div>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center gap-3">
            <span className="text-red-400 font-bold text-sm uppercase tracking-widest text-center">Critical Execution Error</span>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 text-[10px] font-black rounded-lg">REBOOT SYSTEM</button>
          </div>
        ) : (
          <Board 
            tasks={filteredTasks} 
            onTransition={moveTask} 
            onDelete={deleteTask} 
          />
        )}
      </main>

      {/* 3. MODAL - Clipping Fix applied */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/[0.08] rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] p-8 md:p-10 animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Create New Task</h3>
              <p className="text-zinc-500 text-sm mt-2 font-medium">Define parameters for the new cycle.</p>
            </div>

            <TaskForm 
              onSubmit={handleCreateTask} 
              onClose={() => setIsModalOpen(false)} 
            />
          </div>
        </div>
      )}

      <footer className="max-w-[1400px] mx-auto px-6 py-12 border-t border-white/[0.02] flex justify-between items-center opacity-30">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">© 2026 Lifecycle Ops</span>
      </footer>
    </div>
  );
}